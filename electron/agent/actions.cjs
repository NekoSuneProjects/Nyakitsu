const { inspectPage, prepareTarget } = require('./observation.cjs')

function webUrl(input) {
  const url = new URL(input)
  if (!['http:','https:'].includes(url.protocol) || url.username || url.password) throw new Error('Use an HTTP or HTTPS address without embedded credentials.')
  return url
}

function parseAction(text) {
  const value = JSON.parse(String(text).trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, ''))
  if (!value || !['navigate','click','type','select','scroll','wait','done','login'].includes(value.action)) throw new Error('The model did not return a supported browser action. Try a different model.')
  if (typeof value.reason !== 'string' || value.reason.length > 2000) throw new Error('A short action explanation is required.')
  if (value.action === 'navigate') webUrl(value.url)
  if (['click','type','select'].includes(value.action) && (!Number.isInteger(value.id) || value.id < 0)) throw new Error('Invalid control identifier.')
  if (['type','select'].includes(value.action) && (typeof value.text !== 'string' || value.text.length > 8000)) throw new Error('Invalid input text.')
  if (value.action === 'scroll' && !['up','down'].includes(value.direction)) throw new Error('Invalid scroll direction.')
  return value
}

function needsApproval(action, target) {
  // Only plain navigation links auto-proceed. Other controls may change an account.
  return action.action !== 'click' || !target.href || /delete|remove|logout|sign.?out|claim|purchase|checkout|order|subscribe/i.test(target.label + target.href)
}

class BrowserActions {
  constructor(tabs, tabId) { this.tabs = tabs; this.tabId = tabId }
  get wc() {
    const wc = this.tabs.tabs.get(this.tabId)?.view.webContents
    if (!wc || wc.isDestroyed() || this.tabs.activeId !== this.tabId) throw new Error('Return to the task’s tab and resume. Its tab was changed or closed.')
    return wc
  }
  async observe() { return this.wc.executeJavaScriptInIsolatedWorld(999,[{ code:`(${inspectPage.toString()})()` }]) }
  async perform(action, page, signal) {
    signal.throwIfAborted()
    const wc = this.wc
    if (wc.getURL() !== page.url) throw new Error('The page changed. Resume to inspect it again.')
    if (action.action === 'navigate') { await wc.loadURL(webUrl(action.url).href); return }
    if (['click','type','select'].includes(action.action)) {
      const target = page.controls.find((el) => el.id === action.id)
      if (!target || target.sensitive) throw new Error('This field requires manual interaction.')
      const prepared = await wc.executeJavaScriptInIsolatedWorld(999,[{ code:`(() => { try { return { point:(${prepareTarget.toString()})(${JSON.stringify(page.snapshot)},${action.id},${JSON.stringify(target)},${action.action === 'type'}) } } catch(error) { return { error:error.message } } })()` }])
      if (prepared.error) throw new Error(prepared.error)
      const point = prepared.point
      signal.throwIfAborted()
      if (this.wc !== wc) throw new Error('Task tab changed.')
      wc.sendInputEvent({ type:'mouseMove',...point })
      if (action.action !== 'select') {
        wc.sendInputEvent({ type:'mouseDown',button:'left',clickCount:1,...point })
        wc.sendInputEvent({ type:'mouseUp',button:'left',clickCount:1,...point })
      }
      if (action.action === 'type') { wc.selectAll(); await wc.insertText(action.text) }
      if (action.action === 'select') {
        await wc.executeJavaScriptInIsolatedWorld(999,[{ code:`(() => {
          const el = globalThis.nyakitsuSnapshot?.nodes[${action.id}];
          if (!el || el.tagName !== 'SELECT') throw new Error('Not a select control.');
          const option = [...el.options].find(o => o.value === ${JSON.stringify(action.text)} || o.text === ${JSON.stringify(action.text)});
          if (!option || option.disabled) throw new Error('Option unavailable.');
          el.value = option.value; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
        })()` }])
      }
    } else if (action.action === 'scroll') {
      await wc.executeJavaScriptInIsolatedWorld(999,[{ code:`window.scrollBy(0,${action.direction === 'up' ? -600 : 600})` }])
    }
  }
}

module.exports = { BrowserActions, webUrl, parseAction, needsApproval }
