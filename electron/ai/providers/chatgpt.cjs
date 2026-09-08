const path = require('node:path')
const fs = require('node:fs')

// This process only produces text decisions. Nyakitsu owns all browser actions.
const plannerConfig = {
  'features.shell_tool':false, 'features.browser_use':false, 'features.computer_use':false,
  'features.apps':false, 'features.plugins':false, 'features.multi_agent':false,
  'features.multi_agent_v2':false, 'features.code_mode':false, 'features.code_mode_host':false,
  'features.hooks':false, 'features.memories':false, 'features.view_image':false,
  'features.workspace_dependencies':false, 'features.image_generation':false,
  web_search:'disabled'
}

async function chatWithChatGpt(account, settings, messages, signal) {
  if (!(await account.status()).signedIn) throw new Error('Open AI settings and sign in with ChatGPT first.')
  signal?.throwIfAborted()
  const cwd = path.join(account.transport.home, 'empty-workspace')
  fs.mkdirSync(cwd, { recursive:true })
  const { thread } = await account.request('thread/start', {
    ...(settings.model ? { model:settings.model } : {}), cwd, ephemeral:true,
    sandbox:'read-only', approvalPolicy:'never', config:plannerConfig,
    baseInstructions:messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n')
  })
  return new Promise((resolve,reject) => {
    let turnId, text = '', settled = false, interrupted = false
    const transport = account.transport
    const interrupt = () => { if (turnId && transport.child) transport.request('turn/interrupt', { threadId:thread.id, turnId }).catch(() => {}) }
    const finish = (error) => {
      if (settled) return
      if (error) { interrupted = true; interrupt() }
      settled = true; clearTimeout(timer)
      transport.off('notification', receive); transport.off('disconnected', disconnected); signal?.removeEventListener('abort', abort)
      if (transport.child) transport.request('thread/unsubscribe', { threadId:thread.id }).catch(() => {})
      if (error) reject(error); else resolve(text)
    }
    const abort = () => finish(new Error('Task stopped.'))
    const disconnected = () => finish(new Error('ChatGPT disconnected. Please try again.'))
    const timer = setTimeout(() => finish(new Error('ChatGPT took too long to respond. Please try again.')), 180000)
    const receive = ({ method, params }) => {
      if (params?.threadId !== thread.id) return
      if (method === 'turn/started') turnId = params.turn.id
      if (method === 'item/completed' && params.item?.type === 'agentMessage') text = params.item.text
      if (method === 'turn/completed') finish(params.turn.status === 'completed' ? null : new Error(params.turn.error?.message || 'ChatGPT could not complete the request.'))
    }
    transport.on('notification', receive); transport.on('disconnected', disconnected)
    signal?.addEventListener('abort', abort, { once:true })
    if (signal?.aborted) { abort(); return }
    account.request('turn/start', { threadId:thread.id, input:[{ type:'text', text:JSON.stringify(messages.filter((m) => m.role !== 'system')) }] })
      .then(({ turn }) => { turnId = turn.id; if (interrupted) interrupt() }).catch(finish)
  })
}

module.exports = { chatWithChatGpt, plannerConfig }
