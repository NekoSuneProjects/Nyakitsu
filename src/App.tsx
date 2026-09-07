import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Bot, Globe2, LoaderCircle,
  MessageSquareText, Plus, RefreshCw, Send, Settings2, Sparkles, Square,
  X, Zap
} from 'lucide-react'
import type { AiSettings, ChatMessage, ProviderInfo, TabInfo } from './types'

const HOME = 'https://www.google.com/'

function id() {
  return crypto.randomUUID()
}

export default function App() {
  const [tabs, setTabs] = useState<TabInfo[]>([])
  const [active, setActive] = useState<TabInfo | null>(null)
  const [address, setAddress] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null)
  const [providerId, setProviderId] = useState('ollama')
  const [model, setModel] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: id(), role: 'assistant', content: 'Nya! I’m Nyakitsu AI. Ask me about this page, summarize it, compare tabs, or help you browse.' }
  ])
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const chatEnd = useRef<HTMLDivElement>(null)

  const currentProvider = useMemo(
    () => providers.find((provider) => provider.id === providerId),
    [providers, providerId]
  )

  useEffect(() => {
    Promise.all([
      window.nyakitsu.browser.listTabs(),
      window.nyakitsu.ai.providers(),
      window.nyakitsu.ai.settings()
    ]).then(([initialTabs, providerList, settings]) => {
      setTabs(initialTabs)
      const initialActive = initialTabs.find((tab) => tab.active) ?? initialTabs[0] ?? null
      setActive(initialActive)
      setAddress(initialActive?.url ?? '')
      setProviders(providerList)
      setAiSettings(settings)
      setProviderId(settings.providerId)
      setModel(settings.model)
      setBaseUrl(settings.baseUrl)
    })

    const offTabs = window.nyakitsu.browser.onTabsChanged(setTabs)
    const offActive = window.nyakitsu.browser.onActiveTabChanged((tab) => {
      setActive(tab)
      setAddress(tab?.url ?? '')
    })
    return () => { offTabs(); offActive() }
  }, [])

  useEffect(() => {
    const update = () => window.nyakitsu.browser.setLayout({
      top: 104,
      right: sidebarOpen ? 380 : 0
    })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [sidebarOpen])

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    const provider = providers.find((item) => item.id === providerId)
    if (provider && providerId !== aiSettings?.providerId) {
      setBaseUrl(provider.baseUrl)
      setModel('')
      setModels([])
    }
  }, [providerId, providers, aiSettings?.providerId])

  async function submitAddress(event: FormEvent) {
    event.preventDefault()
    await window.nyakitsu.browser.navigate(address)
  }

  async function refreshModels() {
    setBusy(true)
    try {
      const result = await window.nyakitsu.ai.models({ providerId, baseUrl, apiKey: apiKey || undefined })
      setModels(result)
      if (!model && result[0]) setModel(result[0])
    } catch (error) {
      setMessages((value) => [...value, { id: id(), role: 'assistant', content: `Could not load models: ${String(error)}` }])
    } finally {
      setBusy(false)
    }
  }

  async function saveAi() {
    const saved = await window.nyakitsu.ai.saveSettings({ providerId, model, baseUrl, apiKey: apiKey || undefined })
    setAiSettings(saved)
    setApiKey('')
    setSettingsOpen(false)
  }

  async function sendPrompt(text = prompt) {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    const userMessage: ChatMessage = { id: id(), role: 'user', content: trimmed }
    const next = [...messages, userMessage]
    setMessages(next)
    setPrompt('')
    setBusy(true)
    try {
      const response = await window.nyakitsu.ai.chat({
        messages: next.slice(-12).map(({ role, content }) => ({ role, content })),
        includePage: true
      })
      setMessages((value) => [...value, { id: id(), role: 'assistant', content: response.text }])
    } catch (error) {
      setMessages((value) => [...value, { id: id(), role: 'assistant', content: `AI request failed: ${String(error)}` }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="browser-chrome">
        <div className="tab-strip">
          <div className="brand"><span className="brand-mark">猫狐</span><strong>Nyakitsu</strong></div>
          <div className="tabs">
            {tabs.map((tab) => (
              <button key={tab.id} className={`tab ${active?.id === tab.id ? 'active' : ''}`} onClick={() => window.nyakitsu.browser.activateTab(tab.id)}>
                <Globe2 size={14} />
                <span>{tab.title || 'New Tab'}</span>
                {tab.loading && <LoaderCircle size={12} className="spin" />}
                <X size={13} className="tab-close" onClick={(event) => { event.stopPropagation(); window.nyakitsu.browser.closeTab(tab.id) }} />
              </button>
            ))}
            <button className="icon-button small" title="New tab" onClick={() => window.nyakitsu.browser.newTab(HOME)}><Plus size={17} /></button>
          </div>
        </div>

        <div className="toolbar">
          <button className="icon-button" disabled={!active?.canGoBack} onClick={() => window.nyakitsu.browser.back()}><ArrowLeft size={18} /></button>
          <button className="icon-button" disabled={!active?.canGoForward} onClick={() => window.nyakitsu.browser.forward()}><ArrowRight size={18} /></button>
          <button className="icon-button" onClick={() => active?.loading ? window.nyakitsu.browser.stop() : window.nyakitsu.browser.reload()}>
            {active?.loading ? <Square size={15} /> : <RefreshCw size={17} />}
          </button>
          <form className="address-form" onSubmit={submitAddress}>
            <Globe2 size={16} />
            <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Search or enter address" />
          </form>
          <button className={`ai-toggle ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen((value) => !value)}><Sparkles size={17} /> AI</button>
        </div>
      </header>

      <main className="stage">
        <div className="browser-placeholder"><div><Globe2 size={34} /><p>Web content is rendered in an isolated Chromium view.</p></div></div>
        {sidebarOpen && (
          <aside className="ai-sidebar">
            <div className="assistant-header">
              <div><div className="assistant-title"><Bot size={19} /> Nyakitsu AI</div><small>{currentProvider?.name ?? 'Choose provider'} · {model || 'model not set'}</small></div>
              <button className="icon-button" onClick={() => setSettingsOpen((value) => !value)}><Settings2 size={17} /></button>
            </div>

            {settingsOpen ? (
              <section className="settings-panel">
                <h3>AI Provider</h3>
                <label>Provider<select value={providerId} onChange={(event) => setProviderId(event.target.value)}>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}{provider.freeTier ? ' · free tier' : ''}{provider.local ? ' · local' : ''}</option>)}</select></label>
                <label>Base URL<input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} /></label>
                <label>API key {currentProvider?.keyRequired ? '' : '(optional)'}<input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={aiSettings?.hasApiKey && providerId === aiSettings.providerId ? 'Saved securely · enter to replace' : 'API key'} /></label>
                <div className="model-row"><label>Model<input list="nyakitsu-models" value={model} onChange={(event) => setModel(event.target.value)} placeholder="Model ID" /></label><button className="secondary" onClick={refreshModels}>Discover</button></div>
                <datalist id="nyakitsu-models">{models.map((item) => <option value={item} key={item} />)}</datalist>
                <p className="hint">Keys are stored by the Electron main process using OS-backed encryption when available. Websites never receive your provider key.</p>
                <button className="primary" onClick={saveAi}>Save provider</button>
              </section>
            ) : (
              <>
                <div className="quick-actions">
                  <button onClick={() => sendPrompt('Summarize the current page. Give me the important points and any useful links or actions.')}><MessageSquareText size={16} /> Summarize</button>
                  <button onClick={() => sendPrompt('Explain the selected text on this page. If nothing is selected, explain the main topic of the page simply.')}><Zap size={16} /> Explain</button>
                  <button onClick={() => sendPrompt('Look at the current page and tell me what I can usefully do next.')}><Sparkles size={16} /> What next?</button>
                </div>
                <div className="messages">
                  {messages.map((message) => <div key={message.id} className={`message ${message.role}`}><span>{message.role === 'assistant' ? 'NYA' : 'YOU'}</span><p>{message.content}</p></div>)}
                  {busy && <div className="message assistant"><span>NYA</span><p className="thinking"><LoaderCircle className="spin" size={15}/> Thinking…</p></div>}
                  <div ref={chatEnd} />
                </div>
                <form className="composer" onSubmit={(event) => { event.preventDefault(); sendPrompt() }}>
                  <textarea rows={2} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask about this page or tell Nyakitsu what to do…" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendPrompt() } }} />
                  <button disabled={busy || !prompt.trim()}><Send size={17} /></button>
                </form>
              </>
            )}
          </aside>
        )}
      </main>
    </div>
  )
}
