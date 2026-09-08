const { spawn } = require('node:child_process')
const { createInterface } = require('node:readline')
const { createRequire } = require('node:module')
const { EventEmitter } = require('node:events')
const path = require('node:path')
const fs = require('node:fs')

function executable() {
  const req = createRequire(require.resolve('@openai/codex/package.json'))
  const root = path.dirname(req.resolve(`@openai/codex-${process.platform}-${process.arch}/package.json`))
  const cpu = { x64:'x86_64', arm64:'aarch64' }[process.arch]
  const os = { win32:'pc-windows-msvc', linux:'unknown-linux-musl', darwin:'apple-darwin' }[process.platform]
  if (!cpu || !os) throw new Error('ChatGPT connection is unavailable on this platform.')
  return path.join(root, 'vendor', `${cpu}-${os}`, 'bin', process.platform === 'win32' ? 'codex.exe' : 'codex').replace('app.asar', 'app.asar.unpacked')
}

class CodexTransport extends EventEmitter {
  constructor(home, options = {}) {
    super(); this.home = home; this.spawn = options.spawn || spawn; this.executable = options.executable || executable
    this.pending = new Map(); this.sequence = 0; this.ready = null; this.child = null
  }
  async start() {
    if (this.ready) return this.ready
    this.ready = this.connect().catch((error) => { this.close(); throw error })
    return this.ready
  }
  async connect() {
    fs.mkdirSync(this.home, { recursive:true })
    const env = { ...process.env, CODEX_HOME:this.home }
    for (const key of ['OPENAI_API_KEY','CODEX_API_KEY','OPENAI_BASE_URL','CODEX_CONFIG','CODEX_HOME_OVERRIDE']) delete env[key]
    const child = this.spawn(this.executable(), ['app-server','--listen','stdio://'], { cwd:this.home, env, windowsHide:true, stdio:['pipe','pipe','pipe'] })
    this.child = child
    child.stderr.resume()
    const fail = () => { if (this.child === child) this.close() }
    child.on('error', fail); child.on('exit', fail); child.stdin.on('error', fail)
    createInterface({ input:child.stdout }).on('line', (line) => {
      if (this.child !== child) return
      let message
      try { message = JSON.parse(line) } catch { return }
      if (message.method && message.id !== undefined) {
        // No host tools or credential requests are delegated to the model adapter.
        this.write({ id:message.id, error:{ code:-32601, message:'Host tools are unavailable.' } })
      } else if (message.id !== undefined) {
        const request = this.pending.get(message.id)
        if (!request) return
        this.pending.delete(message.id)
        if (message.error) request.reject(new Error(message.error.message || 'ChatGPT request failed.'))
        else request.resolve(message.result)
      } else this.emit('notification', message)
    })
    await this.request('initialize', { clientInfo:{ name:'nyakitsu', title:'Nyakitsu', version:'0.1.0' } })
    this.write({ method:'initialized' })
  }
  write(message) {
    if (!this.child || this.child.stdin.destroyed) throw new Error('ChatGPT is disconnected.')
    this.child.stdin.write(JSON.stringify(message) + '\n')
  }
  request(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.sequence
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('ChatGPT connection timed out. Try reconnecting.')) }, 30000)
      const finish = (fn, value) => { clearTimeout(timer); fn(value) }
      this.pending.set(id, { resolve:(v) => finish(resolve,v), reject:(e) => finish(reject,e) })
      try { this.write({ id, method, params }) } catch (error) { this.pending.delete(id); finish(reject,error) }
    })
  }
  close() {
    const child = this.child
    this.child = null; this.ready = null
    for (const request of this.pending.values()) request.reject(new Error('The ChatGPT connection closed.'))
    this.pending.clear()
    if (child) { child.kill(); this.emit('disconnected') }
  }
}

module.exports = { CodexTransport, executable }
