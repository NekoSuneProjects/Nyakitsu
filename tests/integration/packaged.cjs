const { app } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const assert = require('node:assert/strict')

app.whenReady().then(async () => {
  let account
  try {
    const root = path.resolve('release/win-unpacked/resources/app.asar')
    for (const file of ['electron/main.cjs','electron/ai/providers/chatgpt.cjs','electron/agent/actions.cjs','dist/index.html']) {
      assert.equal(fs.readFileSync(path.join(root,file),'utf8'),fs.readFileSync(file,'utf8'),`Packaged file is stale: ${file}`)
    }
    const { executable } = require(path.join(root,'electron/ai/auth/codex-transport.cjs'))
    assert.ok(executable().includes('app.asar.unpacked'))
    assert.ok(fs.existsSync(executable()))
    const { ChatGptAccount } = require(path.join(root,'electron/ai/auth/chatgpt.cjs'))
    account = new ChatGptAccount(fs.mkdtempSync(path.join(os.tmpdir(),'nyakitsu-package-test-')),() => {})
    assert.equal((await account.status()).signedIn,false)
    account.close()
    console.log('PASS: packaged source matches, native Codex binary is unpacked and starts, account isolation works.')
    app.exit(0)
  } catch (error) { account?.close(); console.error(error); app.exit(1) }
})
