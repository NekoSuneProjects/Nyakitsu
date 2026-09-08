const { app,BrowserWindow,ipcMain } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const assert = require('node:assert/strict')
const { registerHandlers } = require('../../electron/ipc/handlers.cjs')
app.disableHardwareAcceleration()
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'nyakitsu-ui-test-')))

app.whenReady().then(async () => {
  const window = new BrowserWindow({show:false,width:1480,height:940,webPreferences:{offscreen:true,preload:path.resolve('electron/preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}})
  let settings = {providerId:'chatgpt',model:'',baseUrl:'',hasApiKey:false}
  let loginRequested = false, modelRequested = false
  registerHandlers({ ipcMain,getWindow:() => window,getTabs:() => ({list:() => [],setLayout:() => {}}),getAgent:() => ({}),
    account:{status:async () => ({signedIn:false,plan:null,pending:false}),login:async () => { loginRequested = true; return {pending:true} },models:async () => { modelRequested = true; return ['test-account-model'] }},
    store:{publicSettings:() => settings,privateSettings:() => settings,saveSettings:(value) => { settings = {...value,hasApiKey:false}; return settings }},generate:async () => 'Test response',openExternal:() => {throw new Error('No external login in UI test')} })
  try {
    await window.loadFile(path.resolve('dist/index.html'))
    const evaluate = (code) => window.webContents.executeJavaScript(code)
    const waitFor = async (code) => {
      for (let attempt = 0; attempt < 100; attempt++) { if (await evaluate(code)) return; await new Promise((resolve) => setTimeout(resolve,100)) }
      throw new Error('UI did not reach expected state.')
    }
    const click = (label) => evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(el => el.textContent.trim() === ${JSON.stringify(label)}); if (!button) throw new Error('Missing button'); button.click(); })()`)
    const capture = async (filename) => {
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          const frame = await window.webContents.capturePage()
          if (!frame.isEmpty()) { fs.writeFileSync(filename,frame.toPNG()); return }
        } catch (error) { if (attempt === 9) throw error }
        window.webContents.invalidate()
        await new Promise((resolve) => setTimeout(resolve,200))
      }
      throw new Error('UI screenshot remained empty.')
    }
    await waitFor("document.body.innerText.includes('Sign in with ChatGPT')")
    const before = await evaluate('document.body.innerText')
    assert.ok(before.includes('AI connection'))
    assert.ok(!before.includes('API key (optional)'))
    fs.mkdirSync('.test-artifacts',{recursive:true})
    await capture('.test-artifacts/chatgpt-settings.png')
    await click('Sign in with ChatGPT')
    await waitFor("!document.querySelector('.account-actions button').disabled")
    assert.equal(loginRequested,true)
    await click('Discover')
    await waitFor("document.querySelector('input[list]').value === 'test-account-model'")
    assert.equal(modelRequested,true)
    await click('Save connection')
    await waitFor("document.body.innerText.includes('Browser task') && !document.body.innerText.includes('AI connection')")
    assert.equal(settings.model,'test-account-model')
    window.webContents.send('agent:approval',{id:'test-approval',message:'Allow this task to read and control this website?',details:'https://example.com'})
    window.webContents.send('agent:step',{step:1,action:'navigate',text:'Open the requested website.'})
    await waitFor("document.body.innerText.includes('https://example.com')")
    assert.ok(await evaluate("[...document.querySelectorAll('button')].some(b => b.textContent === 'Allow')"))
    await capture('.test-artifacts/task-approval.png')
    console.log('PASS: ChatGPT settings, sign-in button dispatch, model discovery, saving, task mode and approval rendering.')
    window.destroy(); app.exit(0)
  } catch (error) { console.error(error); window.destroy(); app.exit(1) }
})
