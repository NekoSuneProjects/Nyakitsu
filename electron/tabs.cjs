const { WebContentsView } = require('electron')

class TabManager {
  constructor(window, send) {
    this.window = window
    this.send = send
    this.tabs = new Map()
    this.activeId = null
    this.layout = { top:104, right:380 }
  }

  create(url = 'https://www.google.com/') {
    const view = new WebContentsView({ webPreferences:{ contextIsolation:true, nodeIntegration:false, sandbox:true, webSecurity:true } })
    const id = view.webContents.id
    const state = { id, view, title:'New Tab', url, favicon:'', loading:false, canGoBack:false, canGoForward:false }
    this.tabs.set(id, state)
    this.window.contentView.addChildView(view)
    this.bind(state)
    view.webContents.loadURL(this.normalise(url))
    this.activate(id)
    this.emit()
    return this.public(state)
  }

  bind(tab) {
    const wc = tab.view.webContents
    const sync = () => {
      tab.url = wc.getURL() || tab.url
      tab.title = wc.getTitle() || tab.title
      tab.loading = wc.isLoading()
      tab.canGoBack = wc.navigationHistory.canGoBack()
      tab.canGoForward = wc.navigationHistory.canGoForward()
      this.emit()
    }
    wc.on('did-start-loading', sync)
    wc.on('did-stop-loading', sync)
    wc.on('page-title-updated', (_e, title) => { tab.title = title; this.emit() })
    wc.on('page-favicon-updated', (_e, favicons) => { tab.favicon = favicons?.[0] || ''; this.emit() })
    wc.on('did-navigate', sync)
    wc.on('did-navigate-in-page', sync)
    wc.setWindowOpenHandler(({ url }) => { this.create(url); return { action:'deny' } })
    wc.on('will-navigate', (event, url) => {
      if (!/^https?:|^file:|^about:/.test(url)) event.preventDefault()
    })
  }

  normalise(input) {
    const value = String(input || '').trim()
    if (!value) return 'https://www.google.com/'
    if (/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(value)) return value
    if (/^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?(\/.*)?$/.test(value)) return `http://${value}`
    if (/^[\w.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(value)) return `https://${value}`
    return `https://www.google.com/search?q=${encodeURIComponent(value)}`
  }

  public(tab) {
    return { id:tab.id, title:tab.title, url:tab.url, favicon:tab.favicon, loading:tab.loading, canGoBack:tab.canGoBack, canGoForward:tab.canGoForward, active:tab.id === this.activeId }
  }

  list() { return [...this.tabs.values()].map((tab) => this.public(tab)) }
  active() { return this.tabs.get(this.activeId) || null }

  activate(id) {
    const next = this.tabs.get(id)
    if (!next) return
    for (const tab of this.tabs.values()) tab.view.setVisible(tab.id === id)
    this.activeId = id
    this.applyBounds()
    next.view.webContents.focus()
    this.send('browser:active-tab', this.public(next))
    this.emit()
  }

  close(id) {
    const tab = this.tabs.get(id)
    if (!tab) return
    const ids = [...this.tabs.keys()]
    const index = ids.indexOf(id)
    this.window.contentView.removeChildView(tab.view)
    tab.view.webContents.close()
    this.tabs.delete(id)
    if (!this.tabs.size) return this.create()
    if (this.activeId === id) this.activate(ids[index + 1] || ids[index - 1] || [...this.tabs.keys()][0])
    this.emit()
  }

  setLayout(layout) { this.layout = { ...this.layout, ...layout }; this.applyBounds() }
  applyBounds() {
    const tab = this.active()
    if (!tab || this.window.isDestroyed()) return
    const [width, height] = this.window.getContentSize()
    tab.view.setBounds({ x:0, y:this.layout.top, width:Math.max(0, width - this.layout.right), height:Math.max(0, height - this.layout.top) })
  }

  async context() {
    const tab = this.active()
    if (!tab) return { title:'', url:'', text:'', selection:'' }
    const result = await tab.view.webContents.executeJavaScript(`(() => ({ text:(document.body?.innerText || '').slice(0, 30000), selection:String(getSelection?.() || '').slice(0, 8000) }))()`, true)
    return { title:tab.title, url:tab.url, text:result.text || '', selection:result.selection || '' }
  }

  action(name) {
    const wc = this.active()?.view.webContents
    if (!wc) return
    if (name === 'back' && wc.navigationHistory.canGoBack()) wc.navigationHistory.goBack()
    if (name === 'forward' && wc.navigationHistory.canGoForward()) wc.navigationHistory.goForward()
    if (name === 'reload') wc.reload()
    if (name === 'stop') wc.stop()
  }

  navigate(input) { const tab = this.active(); if (tab) return tab.view.webContents.loadURL(this.normalise(input)) }
  emit() { this.send('browser:tabs', this.list()); const tab = this.active(); if (tab) this.send('browser:active-tab', this.public(tab)) }
}

module.exports = { TabManager }
