const { test } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { ChatGptAccount } = require('../../electron/ai/auth/chatgpt.cjs')

class FakeTransport extends EventEmitter {
  constructor() { super(); this.calls = []; this.account = null; this.url = 'https://auth.openai.com/authorize?test=true' }
  async start() {}
  async request(method,params) {
    this.calls.push({method,params})
    if (method === 'account/read') return {account:this.account}
    if (method === 'account/login/start') return {loginId:'login-test',authUrl:this.url}
    if (method === 'model/list') return {data:[{model:'account-model'}],nextCursor:null}
    return {}
  }
  close() {}
}

test('OAuth opens only official HTTPS login, supports cancel and does not expose tokens',async () => {
  const transport = new FakeTransport(), events = []
  const account = new ChatGptAccount('',(e) => events.push(e),transport)
  let opened
  assert.deepEqual(await account.login(async (url) => { opened = url }),{pending:true})
  assert.match(opened,/^https:\/\/auth\.openai\.com/)
  assert.equal((await account.status()).pending,true)
  await account.cancel()
  assert.equal((await account.status()).pending,false)
  assert.ok(transport.calls.some((c) => c.method === 'account/login/cancel'))
  transport.account = {type:'chatgpt',planType:'plus',email:'private@example.com',accessToken:'private'}
  assert.deepEqual(await account.status(),{signedIn:true,plan:'plus',pending:false})
  assert.deepEqual(await account.login(() => assert.fail('Already signed in')),{pending:false})
  transport.emit('notification',{method:'account/login/completed',params:{success:true}})
  assert.deepEqual(events,[{error:null}])
})

test('invalid OAuth URL is rejected and login is canceled',async () => {
  const transport = new FakeTransport()
  transport.url = 'https://auth.openai.com.evil.example/authorize'
  const account = new ChatGptAccount('',() => {},transport)
  await assert.rejects(account.login(() => assert.fail('Must not open')),/Unexpected/)
  assert.equal(account.loginId,null)
  assert.ok(transport.calls.some((c) => c.method === 'account/login/cancel'))
})
