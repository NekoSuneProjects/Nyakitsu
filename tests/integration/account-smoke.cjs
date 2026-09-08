const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const assert = require('node:assert/strict')
const { ChatGptAccount } = require('../../electron/ai/auth/chatgpt.cjs')
const { plannerConfig } = require('../../electron/ai/providers/chatgpt.cjs')

async function main() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(),'nyakitsu-account-test-'))
  const account = new ChatGptAccount(home,() => {})
  try {
    const status = await account.status()
    assert.equal(status.signedIn,false)
    const workspace = path.join(home,'empty-workspace')
    fs.mkdirSync(workspace,{recursive:true})
    const { thread } = await account.request('thread/start',{cwd:workspace,ephemeral:true,sandbox:'read-only',approvalPolicy:'never',config:plannerConfig,baseInstructions:'Return text only. No tools.'})
    assert.equal(typeof thread.id,'string')
    await account.request('thread/unsubscribe',{threadId:thread.id})
    await account.login(async (url) => { assert.equal(new URL(url).hostname,'auth.openai.com') })
    assert.equal((await account.status()).pending,true)
    await account.cancel()
    assert.equal((await account.status()).pending,false)
    console.log('PASS: bundled Codex handshake, isolated signed-out status, planner thread configuration, official OAuth URL, cancellation. No user login or inference performed.')
  } finally { account.close() }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1 })
