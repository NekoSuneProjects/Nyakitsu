const { app, BrowserWindow, ipcMain, shell, session } = require('electron')
const path = require('node:path')
const { TabManager } = require('./tabs.cjs')
const { listProviders, providerById } = require('./ai/providers.cjs')
const { chat, discoverModels } = require('./ai/client.cjs')
const store = require('./store.cjs')

let mainWindow
let tabs

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 920,
    minHeight: 620,
    backgroundColor: '#07090f',
    title: 'Nyakitsu',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) tabs?.create(url)
    else shell.openExternal(url).catch(() => {})
    return { action:'deny' }
  })

  const devUrl = process.env.NYAKITSU_DEV_SERVER_URL
  if (devUrl) mainWindow.loadURL(devUrl)
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))

  tabs = new TabManager(mainWindow, send)
  tabs.create('https://www.google.com/')
  mainWindow.on('resize', () => tabs?.applyBounds())
  mainWindow.on('closed', () => { tabs = null; mainWindow = null })
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false))
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

ipcMain.handle('browser:list-tabs', () => tabs?.list() || [])
ipcMain.handle('browser:new-tab', (_event, url) => tabs?.create(url))
ipcMain.handle('browser:close-tab', (_event, id) => tabs?.close(Number(id)))
ipcMain.handle('browser:activate-tab', (_event, id) => tabs?.activate(Number(id)))
ipcMain.handle('browser:navigate', (_event, input) => tabs?.navigate(input))
ipcMain.handle('browser:action', (_event, action) => tabs?.action(action))
ipcMain.handle('browser:page-context', () => tabs?.context())
ipcMain.handle('browser:set-layout', (_event, layout) => tabs?.setLayout({ top:Number(layout?.top) || 104, right:Number(layout?.right) || 0 }))

ipcMain.handle('ai:providers', () => listProviders())
ipcMain.handle('ai:settings', () => store.publicSettings())
ipcMain.handle('ai:save-settings', (_event, value) => {
  const provider = providerById(value.providerId)
  return store.saveSettings({ ...value, baseUrl:value.baseUrl || provider.baseUrl })
})
ipcMain.handle('ai:models', async (_event, override = {}) => {
  const saved = store.privateSettings()
  const providerId = override.providerId || saved.providerId
  const provider = providerById(providerId)
  return discoverModels({
    providerId,
    baseUrl:override.baseUrl || (providerId === saved.providerId ? saved.baseUrl : provider.baseUrl),
    apiKey:override.apiKey || (providerId === saved.providerId ? saved.apiKey : '')
  })
})
ipcMain.handle('ai:chat', async (_event, value) => {
  const settings = store.privateSettings()
  const messages = Array.isArray(value?.messages) ? value.messages : []
  const context = value?.includePage ? await tabs?.context() : null
  const system = [
    'You are Nyakitsu AI, the assistant built into the Nyakitsu open-source web browser.',
    'Be concise, useful and transparent. Never claim an action happened unless the browser actually performed it.',
    context ? `Current page title: ${context.title}\nCurrent page URL: ${context.url}\nSelected text: ${context.selection || '(none)'}\nPage text:\n${context.text}` : ''
  ].filter(Boolean).join('\n\n')
  const text = await chat(settings, [{ role:'system', content:system }, ...messages])
  return { text }
})
