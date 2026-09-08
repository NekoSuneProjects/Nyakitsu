const { test } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { chatWithChatGpt } = require('../../electron/ai/providers/chatgpt.cjs')

function fixture(onStart) {
  const transport = new EventEmitter()
  transport.home = fs.mkdtempSync(path.join(os.tmpdir(),'nyakitsu-provider-test-'))
  transport.child = {}
  const calls = []
  const request = async (method,params) => {
    calls.push({method,params})
    if (method === 'thread/start') return {thread:{id:'test-thread'}}
    if (method === 'turn/start') {
      queueMicrotask(() => onStart(transport))
      return {turn:{id:'test-turn'}}
    }
    return {}
  }
  transport.request = request
  return {account:{transport,request,status:async () => ({signedIn:true})},transport,calls}
}

test('subscription provider reads completed output and ignores other tasks',async () => {
  const {account,transport,calls} = fixture((emitter) => {
    emitter.emit('notification',{method:'item/completed',params:{threadId:'other',item:{type:'agentMessage',text:'wrong'}}})
    emitter.emit('notification',{method:'item/completed',params:{threadId:'test-thread',item:{type:'agentMessage',text:'verified answer'}}})
    emitter.emit('notification',{method:'turn/completed',params:{threadId:'test-thread',turn:{status:'completed'}}})
  })
  assert.equal(await chatWithChatGpt(account,{},[{role:'user',content:'Hello'}]),'verified answer')
  assert.equal(transport.listenerCount('notification'),0)
  assert.equal(calls.some((call) => call.method === 'turn/interrupt'),false)
  const start = calls.find((call) => call.method === 'thread/start').params
  assert.equal(start.config['features.shell_tool'],false)
  assert.equal(start.sandbox,'read-only')
})

test('stop interrupts a subscription turn and removes listeners',async () => {
  const controller = new AbortController()
  const {account,transport,calls} = fixture((emitter) => {
    emitter.emit('notification',{method:'turn/started',params:{threadId:'test-thread',turn:{id:'test-turn'}}})
    controller.abort()
  })
  await assert.rejects(chatWithChatGpt(account,{},[{role:'user',content:'Hello'}],controller.signal),/stopped/)
  assert.ok(calls.some((call) => call.method === 'turn/interrupt'))
  assert.equal(transport.listenerCount('notification'),0)
})

test('quota errors are reported instead of a successful empty answer',async () => {
  const {account} = fixture((emitter) => emitter.emit('notification',{method:'turn/completed',params:{threadId:'test-thread',turn:{status:'failed',error:{message:'Usage limit reached'}}}}))
  await assert.rejects(chatWithChatGpt(account,{},[{role:'user',content:'Hello'}]),/Usage limit reached/)
})
