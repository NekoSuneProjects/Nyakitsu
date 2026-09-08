import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Globe2, LoaderCircle, Plus, RefreshCw, Sparkles, Square, X } from 'lucide-react'
import type { TabInfo } from '../../types'

export function BrowserChrome({ tabs, active, sidebarOpen, onToggle }: { tabs: TabInfo[]; active: TabInfo | null; sidebarOpen: boolean; onToggle: () => void }) {
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { setAddress(active?.url || '') },[active?.url])
  return <header className="browser-chrome">
    <div className="tab-strip">
      <div className="brand"><span className="brand-mark">猫狐</span><strong>Nyakitsu</strong></div>
      <div className="tabs">{tabs.map((tab) => <div key={tab.id} className={`tab ${active?.id === tab.id ? 'active' : ''}`}>
        <button className="tab-select" onClick={() => window.nyakitsu.browser.activateTab(tab.id)}><Globe2 size={14}/><span>{tab.title || 'New Tab'}</span>{tab.loading && <LoaderCircle size={12} className="spin"/>}</button>
        <button className="tab-close-button" aria-label={`Close ${tab.title}`} onClick={() => window.nyakitsu.browser.closeTab(tab.id)}><X size={13}/></button>
      </div>)}<button className="icon-button small" title="New tab" onClick={() => window.nyakitsu.browser.newTab()}><Plus size={17}/></button></div>
    </div>
    <div className="toolbar">
      <button className="icon-button" title="Back" disabled={!active?.canGoBack} onClick={() => window.nyakitsu.browser.back()}><ArrowLeft size={18}/></button>
      <button className="icon-button" title="Forward" disabled={!active?.canGoForward} onClick={() => window.nyakitsu.browser.forward()}><ArrowRight size={18}/></button>
      <button className="icon-button" title={active?.loading ? 'Stop loading' : 'Reload'} onClick={() => active?.loading ? window.nyakitsu.browser.stop() : window.nyakitsu.browser.reload()}>{active?.loading ? <Square size={15}/> : <RefreshCw size={17}/>}</button>
      <form className="address-form" onSubmit={(e) => { e.preventDefault(); setError(''); window.nyakitsu.browser.navigate(address).catch((err) => setError(String(err))) }}><Globe2 size={16}/><input aria-label="Address or search" title={error} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Search or enter address"/></form>
      <button className={`ai-toggle ${sidebarOpen ? 'active' : ''}`} onClick={onToggle}><Sparkles size={17}/> AI</button>
    </div>
  </header>
}
