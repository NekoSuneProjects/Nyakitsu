const { randomUUID } = require('node:crypto')
const { BrowserActions, webUrl, parseAction, needsApproval } = require('./actions.cjs')
const { plannerMessages } = require('./planner.cjs')

function delay(ms, signal) {
  return new Promise((resolve,reject) => {
    const abort = () => { clearTimeout(timer); reject(new Error('Task stopped.')) }
    const timer = setTimeout(() => { signal.removeEventListener('abort',abort); resolve() }, ms)
    signal.addEventListener('abort',abort,{once:true}); if (signal.aborted) abort()
  })
}

class TaskRunner {
  constructor(tabs, generate, send) { this.tabs = tabs; this.generate = generate; this.send = send; this.task = null; this.controller = null }
  stop() {
    if (!this.controller) return
    this.controller.abort(); this.pending?.resolve(false)
    const wc = this.tabs.tabs.get(this.task?.tabId)?.view.webContents
    if (wc && !wc.isDestroyed()) wc.stop?.()
  }
  approve(id, allow) { if (id === this.pending?.id) this.pending.resolve(allow === true) }
  async confirm(message, details, signal) {
    signal.throwIfAborted()
    const id = randomUUID()
    const allowed = await new Promise((resolve) => {
      const abort = () => resolve(false)
      this.pending = { id, resolve:(value) => { signal.removeEventListener('abort',abort); resolve(value) } }
      signal.addEventListener('abort',abort,{once:true})
      this.send('agent:approval',{ id,message,details })
    })
    this.pending = null; this.send('agent:approval',null)
    if (!allowed) throw new Error('Task stopped. Permission was not granted.')
  }
  async run(settings, messages, resume = false) {
    if (this.controller) throw new Error('A browser task is already running.')
    if (!resume) {
      const tab = this.tabs.active()
      if (!tab) throw new Error('Open a browser tab first.')
      this.task = { tabId:tab.id, messages, history:[], origins:new Set(), status:'running' }
    }
    const task = this.task
    if (!task || task.status === 'done') throw new Error('There is no paused browser task to resume.')
    task.status = 'running'
    this.controller = new AbortController()
    const { signal } = this.controller
    const browser = new BrowserActions(this.tabs, task.tabId)
    const check = () => { signal.throwIfAborted(); return browser.wc }
    const authorize = async (value) => {
      const origin = webUrl(value).origin
      if (!task.origins.has(origin)) { await this.confirm('Allow this task to read and control this website?',origin,signal); check(); task.origins.add(origin) }
    }
    try {
      for (let step = 0; step < 30; step++) {
        await authorize(check().getURL())
        const page = await browser.observe()
        await authorize(page.url)
        const planned = await this.generate(settings,plannerMessages(task,page),signal)
        if (check().getURL() !== page.url) { task.history.push({ result:'Page changed while planning; observe again.' }); continue }
        const action = parseAction(planned)
        this.send('agent:step',{ step:task.history.length + 1,action:action.action,text:action.reason })
        if (action.action === 'done' || action.action === 'login') {
          task.status = action.action === 'done' ? 'done' : 'paused'
          task.history.push({ action, result:action.action === 'login' ? 'Waiting for manual sign-in; recheck before continuing.' : 'Task ended.' })
          return { text:action.reason, resumable:task.status === 'paused' }
        }
        if (action.action === 'navigate') await authorize(action.url)
        if (['click','type','select'].includes(action.action)) {
          const target = page.controls.find((el) => el.id === action.id)
          if (!target) throw new Error('The requested control is not on this page.')
          if (target.sensitive) { task.status = 'paused'; return { text:'Complete this sensitive field yourself, then select Resume task.',resumable:true } }
          if (target.href) await authorize(target.href)
          if (needsApproval(action,target)) await this.confirm('Allow this browser action?',`${webUrl(page.url).origin}\n${action.reason}\nControl: ${target.label || target.tag}${action.text ? '\nText: ' + action.text.slice(0,500) : ''}`,signal)
        }
        check()
        // Record dispatch before acting so resumption cannot assume an unverified action failed.
        task.history.push({ action,result:'Dispatched; verify the next observation before repeating.' })
        await browser.perform(action,page,signal)
        await delay(action.action === 'wait' ? 1200 : 500,signal)
      }
      task.status = 'paused'
      return { text:'Paused at the 30-step limit. Review progress, then resume if needed.',resumable:true }
    } catch (error) {
      task.status = 'paused'
      return { text:signal.aborted ? 'Task stopped. You can resume from the current page.' : `Task paused: ${error.message}`,resumable:true }
    } finally { this.controller = null; this.pending = null; this.send('agent:approval',null) }
  }
}

module.exports = { TaskRunner, delay }
