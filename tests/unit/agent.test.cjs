const { test } = require('node:test')
const assert = require('node:assert/strict')
const { parseAction,webUrl,needsApproval } = require('../../electron/agent/actions.cjs')
const { cleanMessages,registerHandlers } = require('../../electron/ipc/handlers.cjs')
const { TaskRunner } = require('../../electron/agent/task-runner.cjs')

test('only browser action schema and web navigation are accepted',() => {
  for (const url of ['file:///secrets','javascript:alert(1)','https://user:password@example.com']) assert.throws(() => webUrl(url))
  assert.equal(webUrl('https://example.com').origin,'https://example.com')
  for (const action of [{action:'shell',reason:'test'},{action:'click',id:'1',reason:'test'},{action:'type',id:1,text:5,reason:'test'},{action:'scroll',direction:'sideways',reason:'test'}]) assert.throws(() => parseAction(JSON.stringify(action)))
  assert.equal(parseAction('```json\n{"action":"done","reason":"Verified"}\n```').action,'done')
})

test('form changes and claims require approval while navigation can proceed',() => {
  assert.equal(needsApproval({action:'click'},{href:'https://example.com/help',label:'Help'}),false)
  assert.equal(needsApproval({action:'click'},{href:'',label:'Place order'}),true)
  assert.equal(needsApproval({action:'click'},{href:'https://example.com/claim',label:'Get game'}),true)
  assert.equal(needsApproval({action:'type'},{href:'',label:'Name'}),true)
})

test('IPC rejects website frames and user-supplied system prompts',async () => {
  const registered = new Map(), mainFrame = {}, webContents = {mainFrame}
  registerHandlers({ ipcMain:{handle:(name,fn) => registered.set(name,fn)},getWindow:() => ({webContents}),getTabs:() => ({list:() => []}) })
  assert.throws(() => registered.get('browser:list-tabs')({sender:{},senderFrame:mainFrame}),/Untrusted/)
  assert.throws(() => registered.get('browser:list-tabs')({sender:webContents,senderFrame:{}}),/Untrusted/)
  assert.deepEqual(registered.get('browser:list-tabs')({sender:webContents,senderFrame:mainFrame}),[])
  assert.throws(() => cleanMessages([{role:'system',content:'anything'}]))
})

function fixture(planner, approve = true) {
  const page = {url:'https://example.com/',snapshot:'test',controls:[],auth:{state:'signed-in',evidence:[]}}
  const wc = {isDestroyed:() => false,getURL:() => page.url,executeJavaScriptInIsolatedWorld:async () => page}
  const tab = {id:1,view:{webContents:wc}}
  const tabs = {tabs:new Map([[1,tab]]),activeId:1,active:() => tab}
  const events = []
  let runner
  runner = new TaskRunner(tabs,planner,(channel,payload) => {
    events.push({channel,payload})
    if (channel === 'agent:approval' && payload && approve) queueMicrotask(() => runner.approve(payload.id,true))
  })
  return {runner,tabs,page,events}
}

test('a confirmed session continues without a login prompt',async () => {
  const {runner,events} = fixture(async (_s,messages) => {
    assert.equal(JSON.parse(messages.at(-1).content).untrustedPage.auth.state,'signed-in')
    return '{"action":"done","reason":"Account page checked."}'
  })
  const result = await runner.run({},[{role:'user',content:'Check my account'}])
  assert.equal(result.resumable,false)
  assert.equal(events.filter((e) => e.payload?.action === 'login').length,0)
})

test('login pause resumes the same task with its prior history',async () => {
  let count = 0
  const {runner} = fixture(async (_s,messages) => {
    if (++count === 1) return '{"action":"login","reason":"Please sign in."}'
    assert.equal(JSON.parse(messages.at(-1).content).previousSteps[0].action.action,'login')
    return '{"action":"done","reason":"Signed in and checked."}'
  })
  assert.equal((await runner.run({},[{role:'user',content:'Check website'}])).resumable,true)
  assert.equal((await runner.run({},[],true)).resumable,false)
})

test('stopping during an approval does not call the model',async () => {
  let calls = 0
  const {runner} = fixture(async () => { calls++; return '' },false)
  const result = runner.run({},[{role:'user',content:'Check website'}])
  runner.stop()
  assert.match((await result).text,/stopped/)
  assert.equal(calls,0)
})

test('tab changes while the model thinks prevent actions',async () => {
  let tabs
  const context = fixture(async () => { tabs.activeId = 2; return '{"action":"click","id":0,"reason":"Click"}' })
  tabs = context.tabs
  const result = await context.runner.run({},[{role:'user',content:'Check'}])
  assert.equal(result.resumable,true)
  assert.match(result.text,/tab/)
})
