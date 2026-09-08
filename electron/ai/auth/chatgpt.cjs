const { CodexTransport } = require('./codex-transport.cjs')

class ChatGptAccount {
  constructor(home, onChange, transport) {
    this.transport = transport || new CodexTransport(home)
    this.loginId = null
    this.transport.on('notification', ({ method, params }) => {
      if (method === 'account/login/completed') {
        this.loginId = null
        onChange({ error:params.success ? null : 'Sign-in did not complete. Please try again.' })
      }
      if (method === 'account/updated') onChange({ error:null })
    })
  }
  async request(method, params) { await this.transport.start(); return this.transport.request(method, params) }
  async status() {
    const { account } = await this.request('account/read', { refreshToken:false })
    return { signedIn:account?.type === 'chatgpt', plan:account?.type === 'chatgpt' ? account.planType : null, pending:Boolean(this.loginId) }
  }
  async login(open) {
    if ((await this.status()).signedIn) return { pending:false }
    await this.cancel()
    const result = await this.request('account/login/start', { type:'chatgpt' })
    this.loginId = result.loginId
    try {
      const url = new URL(result.authUrl)
      if (url.protocol !== 'https:' || url.hostname !== 'auth.openai.com') throw new Error('Unexpected sign-in address.')
      await open(url.href)
      return { pending:true }
    } catch (error) { await this.cancel(); throw error }
  }
  async cancel() {
    if (this.loginId) { const loginId = this.loginId; this.loginId = null; await this.request('account/login/cancel', { loginId }) }
  }
  async logout() { await this.cancel(); await this.request('account/logout') }
  async models() {
    const models = []
    let cursor
    do {
      const result = await this.request('model/list', { ...(cursor ? { cursor } : {}), limit:100 })
      models.push(...result.data.map((m) => m.model || m.id)); cursor = result.nextCursor
    } while (cursor && models.length < 500)
    return models
  }
  close() { this.transport.close() }
}

module.exports = { ChatGptAccount }
