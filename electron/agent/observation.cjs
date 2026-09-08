// Executed in an isolated JavaScript world. No input values or cookie data are read.
function inspectPage() {
  const visible = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const nodes = [...document.querySelectorAll('a,button,input,textarea,select,[role="button"],[role="link"],[role="menuitem"],summary')].filter(visible).slice(0,500)
  const snapshot = crypto.randomUUID()
  globalThis.nyakitsuSnapshot = { snapshot, nodes }
  const controls = nodes.map((el, id) => ({
    id, tag:el.tagName.toLowerCase(), type:el.getAttribute('type') || '',
    label:(el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || el.getAttribute('placeholder') || el.getAttribute('name') || '').slice(0,200),
    href:el.tagName === 'A' ? el.href : '', disabled:Boolean(el.disabled),
    sensitive:el.matches('input[type="password"],input[type="file"]') || /password|one-time-code|cc-/i.test(el.autocomplete || '')
  }))
  const evidence = controls.filter((el) => /sign[ -]?(in|out)|log[ -]?(in|out)|account|profile|avatar/i.test(el.label)).map(({ id,label }) => ({ id,label }))
  const labels = evidence.map((el) => el.label).join('\n')
  const positive = /\b(sign out|log out|logout)\b/i.test(labels), negative = /\b(sign in|log in|login)\b/i.test(labels)
  return { snapshot, title:document.title, url:location.href, text:(document.body?.innerText || '').slice(0,24000), controls,
    auth:{ state:positive && !negative ? 'signed-in' : negative && !positive ? 'signed-out' : 'unknown', evidence } }
}

function prepareTarget(snapshot, id, expected, typing) {
  const state = globalThis.nyakitsuSnapshot, el = state?.nodes?.[id]
  if (state?.snapshot !== snapshot || !el?.isConnected) throw new Error('The page changed. Inspect again.')
  const label = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || el.getAttribute('placeholder') || el.getAttribute('name') || '').slice(0,200)
  const href = el.tagName === 'A' ? el.href : ''
  if (label !== expected.label || href !== expected.href || el.tagName.toLowerCase() !== expected.tag) throw new Error('The control changed. Inspect again.')
  if (el.disabled) throw new Error('This control is disabled.')
  if (typing && (!['INPUT','TEXTAREA'].includes(el.tagName) || /password|file|hidden/i.test(el.type) || /password|one-time-code|cc-/i.test(el.autocomplete || ''))) throw new Error('This field requires manual entry.')
  el.scrollIntoView({ block:'center',inline:'center' })
  const rect = el.getBoundingClientRect()
  const x = Math.round(rect.x + rect.width/2), y = Math.round(rect.y + rect.height/2)
  const hit = document.elementFromPoint(x,y)
  if (!hit || (hit !== el && !el.contains(hit))) throw new Error('This control is covered. Inspect again.')
  const pointer = document.createElement('div')
  pointer.setAttribute('aria-hidden','true')
  pointer.style.cssText = `position:fixed;left:${x - 9}px;top:${y - 9}px;width:18px;height:18px;border:3px solid #8d63ff;border-radius:50%;background:#8d63ff44;box-shadow:0 0 0 4px #8d63ff22;pointer-events:none;z-index:2147483647`
  document.documentElement.appendChild(pointer)
  setTimeout(() => pointer.remove(),1200)
  return { x,y }
}

module.exports = { inspectPage, prepareTarget }
