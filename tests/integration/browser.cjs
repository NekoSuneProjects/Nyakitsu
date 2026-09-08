const { app,BrowserWindow } = require('electron')
const http = require('node:http')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { BrowserActions } = require('../../electron/agent/actions.cjs')
const { TaskRunner } = require('../../electron/agent/task-runner.cjs')
const profile = fs.mkdtempSync(path.join(os.tmpdir(),'nyakitsu-browser-test-'))
app.setPath('userData',profile)

app.whenReady().then(async () => {
  let phase = 'startup'
  const timeout = setTimeout(() => { console.error(`Browser test timed out during ${phase}`); app.exit(1) },60000)
  const server = http.createServer((_req,res) => {
    res.setHeader('Content-Type','text/html')
    res.end(`<html><body style="padding:30px;font-family:sans-serif"><h1>Test store</h1><p>Total: £0.00</p>
      <a href="/help">Help</a><input aria-label="Search"/><input type="password" aria-label="Password" value="private-secret"/>
      <select aria-label="Category"><option value="all">All</option><option value="games">Games</option></select>
      <button id="claim" onclick="document.querySelector('h1').textContent='Owned in library';this.disabled=true">Claim free game</button>
      <footer style="margin-top:150px"><button>Sign out</button></footer></body></html>`)
  })
  await new Promise((resolve) => server.listen(0,'127.0.0.1',resolve))
  const url = `http://127.0.0.1:${server.address().port}/`
  const window = new BrowserWindow({show:false,width:1100,height:800,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}})
  const wc = window.webContents
  const tab = {id:1,view:{webContents:wc}}, tabs = {tabs:new Map([[1,tab]]),activeId:1,active:() => tab}
  const browser = new BrowserActions(tabs,1), signal = new AbortController().signal
  try {
    await wc.loadURL(url)
    phase = 'page observation'
    let page = await browser.observe()
    assert.equal(page.auth.state,'signed-in')
    assert.ok(page.auth.evidence.some((item) => item.label === 'Sign out'))
    assert.ok(!JSON.stringify(page).includes('private-secret'))
    const search = page.controls.find((el) => el.label === 'Search')
    await browser.perform({action:'type',id:search.id,text:'a sample search'},page,signal)
    phase = 'select'
    assert.equal(await wc.executeJavaScript("document.querySelector('input').value"),'a sample search')
    page = await browser.observe()
    const select = page.controls.find((el) => el.label === 'Category')
    await browser.perform({action:'select',id:select.id,text:'games'},page,signal)
    assert.equal(await wc.executeJavaScript("document.querySelector('select').value"),'games')
    phase = 'stale and sensitive controls'
    page = await browser.observe()
    const password = page.controls.find((el) => el.label === 'Password')
    await assert.rejects(browser.perform({action:'type',id:password.id,text:'must not type'},page,signal),/manual/)
    const claim = page.controls.find((el) => el.label === 'Claim free game')
    await wc.executeJavaScript("document.querySelector('#claim').textContent='Paid order'")
    await assert.rejects(browser.perform({action:'click',id:claim.id},page,signal),/changed/)
    await wc.executeJavaScript("document.querySelector('#claim').textContent='Claim free game'")
    let approvals = 0, observations = 0, runner
    phase = 'approved task and verification'
    runner = new TaskRunner(tabs,async (_settings,messages) => {
      const observed = JSON.parse(messages.at(-1).content).untrustedPage
      observations++
      if (observed.text.includes('Owned in library')) return JSON.stringify({action:'done',reason:'Verified ownership in library.'})
      return JSON.stringify({action:'click',id:observed.controls.find((el) => el.label === 'Claim free game').id,reason:'Claim the zero-cost fixture game.'})
    },(channel,payload) => { if (channel === 'agent:approval' && payload) { approvals++; queueMicrotask(() => runner.approve(payload.id,true)) } })
    const result = await runner.run({},[{role:'user',content:'Claim this free game.'}])
    assert.equal(result.resumable,false)
    assert.match(result.text,/Verified ownership/)
    assert.equal(approvals,2)
    assert.equal(observations,2)
    phase = 'authentication states'
    await wc.executeJavaScript("document.querySelector('footer button').textContent='Account'")
    assert.equal((await browser.observe()).auth.state,'unknown')
    await wc.executeJavaScript("document.querySelector('footer button').textContent='Sign in'")
    assert.equal((await browser.observe()).auth.state,'signed-out')
    console.log('PASS: real Chromium input, select, stale-control protection, sensitive fields, account states, approved task action and verification.')
    clearTimeout(timeout); window.destroy(); server.close(); app.exit(0)
  } catch (error) { console.error(error); window.destroy(); server.close(); app.exit(1) }
})
