const { contextBridge, ipcRenderer } = require('electron')

function listen(channel, callback) {
  const handler = (_event, payload) => callback(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

contextBridge.exposeInMainWorld('nyakitsu', {
  browser: {
    listTabs: () => ipcRenderer.invoke('browser:list-tabs'),
    newTab: (url) => ipcRenderer.invoke('browser:new-tab', url),
    closeTab: (id) => ipcRenderer.invoke('browser:close-tab', id),
    activateTab: (id) => ipcRenderer.invoke('browser:activate-tab', id),
    navigate: (input) => ipcRenderer.invoke('browser:navigate', input),
    back: () => ipcRenderer.invoke('browser:action', 'back'),
    forward: () => ipcRenderer.invoke('browser:action', 'forward'),
    reload: () => ipcRenderer.invoke('browser:action', 'reload'),
    stop: () => ipcRenderer.invoke('browser:action', 'stop'),
    getPageContext: () => ipcRenderer.invoke('browser:page-context'),
    setLayout: (layout) => ipcRenderer.invoke('browser:set-layout', layout),
    onTabsChanged: (callback) => listen('browser:tabs', callback),
    onActiveTabChanged: (callback) => listen('browser:active-tab', callback)
  },
  ai: {
    account: () => ipcRenderer.invoke('ai:account'),
    login: () => ipcRenderer.invoke('ai:login'),
    cancelLogin: () => ipcRenderer.invoke('ai:cancel-login'),
    logout: () => ipcRenderer.invoke('ai:logout'),
    onAccountChanged: (callback) => listen('ai:account-changed', callback),
    providers: () => ipcRenderer.invoke('ai:providers'),
    settings: () => ipcRenderer.invoke('ai:settings'),
    saveSettings: (settings) => ipcRenderer.invoke('ai:save-settings', settings),
    models: (input) => ipcRenderer.invoke('ai:models', input),
    chat: (input) => ipcRenderer.invoke('ai:chat', input)
  },
  agent: {
    run: (input) => ipcRenderer.invoke('agent:run', input),
    resume: () => ipcRenderer.invoke('agent:resume'),
    stop: () => ipcRenderer.invoke('agent:stop'),
    approve: (id, allow) => ipcRenderer.invoke('agent:approve', id, allow),
    onStep: (callback) => listen('agent:step', callback),
    onApproval: (callback) => listen('agent:approval', callback)
  }
})
