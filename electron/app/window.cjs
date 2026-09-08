const { BrowserWindow } = require('electron')
const path = require('node:path')
const { TabManager } = require('../tabs.cjs')
const { TaskRunner } = require('../agent/task-runner.cjs')

function createBrowserWindow(generate,send,onClosed) {
  const window = new BrowserWindow({ width:1480,height:940,minWidth:920,minHeight:620,backgroundColor:'#07090f',title:'Nyakitsu',
    webPreferences:{ preload:path.join(__dirname,'..','preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true } })
  const tabs = new TabManager(window,send)
  const agent = new TaskRunner(tabs,generate,send)
  window.webContents.on('will-navigate',(event) => event.preventDefault())
  window.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) tabs.create(url); return { action:'deny' } })
  const devUrl = process.env.NYAKITSU_DEV_SERVER_URL
  if (devUrl) window.loadURL(devUrl)
  else window.loadFile(path.join(__dirname,'..','..','dist','index.html'))
  tabs.create('https://www.google.com/')
  window.on('resize',() => tabs.applyBounds())
  window.on('closed',() => { agent.stop(); onClosed() })
  return { window,tabs,agent }
}

module.exports = { createBrowserWindow }
