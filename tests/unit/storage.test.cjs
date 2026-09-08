const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const path = require('node:path')

test('saved provider keys migrate, remain separated and survive provider switching',() => {
  let saved = JSON.stringify({providerId:'openai',model:'test',baseUrl:'https://api.openai.com/v1',apiKeyEncrypted:'safe:' + Buffer.from('openai-test-key').toString('base64')})
  const fakeFs = {readFileSync:() => saved,mkdirSync:() => {},writeFileSync:(_path,data) => {saved=data}}
  const module = {exports:{}}
  vm.runInNewContext(fs.readFileSync(path.resolve('electron/store.cjs'),'utf8'),{module,Buffer,require:(name) => {
    if (name === 'electron') return {app:{getPath:() => '/test'},safeStorage:{isEncryptionAvailable:() => true,encryptString:(s) => Buffer.from(s),decryptString:(b) => b.toString()}}
    if (name === 'node:fs') return fakeFs
    return require(name)
  }})
  const store = module.exports
  assert.equal(store.privateSettings().apiKey,'openai-test-key')
  store.saveSettings({providerId:'anthropic',model:'test',apiKey:'claude-test-key'})
  assert.equal(store.privateSettings().apiKey,'claude-test-key')
  store.saveSettings({providerId:'chatgpt',model:''})
  assert.equal(store.privateSettings().apiKey,'')
  assert.equal(store.publicSettings().hasApiKey,false)
  store.saveSettings({providerId:'openai',model:'test'})
  assert.equal(store.privateSettings().apiKey,'openai-test-key')
  assert.equal(store.publicSettings().apiKey,undefined)
})
