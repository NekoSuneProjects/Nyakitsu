const { app, ipcMain, shell, session, BrowserWindow } = require('electron')
const path = require('node:path')
const { createBrowserWindow } = require('./app/window.cjs')
const { registerHandlers } = require('./ipc/handlers.cjs')
const { ChatGptAccount } = require('./ai/auth/chatgpt.cjs')
const { chatWithChatGpt } = require('./ai/providers/chatgpt.cjs')
const { chat } = require('./ai/client.cjs')
const store = require('./store.cjs')

let runtime = null
let account
const send = (channel,payload) => { if (runtime && !runtime.window.isDestroyed()) runtime.window.webContents.send(channel,payload) }
const generate = (settings,messages,signal) => settings.providerId === 'chatgpt'
  ? chatWithChatGpt(account,settings,messages,signal) : chat(settings,messages,signal)
const openWindow = () => { runtime = createBrowserWindow(generate,send,() => { runtime = null }) }

app.whenReady().then(() => {
  account = new ChatGptAccount(path.join(app.getPath('userData'),'chatgpt-account'),(state) => send('ai:account-changed',state))
  session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback) => callback(false))
  registerHandlers({ ipcMain,getWindow:() => runtime?.window,getTabs:() => runtime?.tabs,getAgent:() => runtime?.agent,account,store,generate,openExternal:(url) => shell.openExternal(url) })
  openWindow()
  app.on('activate',() => { if (BrowserWindow.getAllWindows().length === 0) openWindow() })
})
app.on('before-quit',() => { runtime?.agent.stop(); account?.close() })
app.on('window-all-closed',() => { if (process.platform !== 'darwin') app.quit() })
