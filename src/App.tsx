import { useEffect, useState } from 'react'
import { useBrowserTabs } from './hooks/useBrowserTabs'
import { BrowserChrome } from './features/navigation/BrowserChrome'
import { AssistantPanel } from './features/assistant/AssistantPanel'

export default function App() {
  const { tabs,active,error } = useBrowserTabs()
  const [sidebarOpen,setSidebarOpen] = useState(true)
  useEffect(() => {
    const update = () => window.nyakitsu.browser.setLayout({ top:104,right:sidebarOpen ? (window.innerWidth <= 900 ? 330 : 380) : 0 })
    update(); window.addEventListener('resize',update)
    return () => window.removeEventListener('resize',update)
  },[sidebarOpen])
  return <div className="app-shell">
    <BrowserChrome tabs={tabs} active={active} sidebarOpen={sidebarOpen} onToggle={() => setSidebarOpen((value) => !value)}/>
    <main className="stage">
      <div className="browser-placeholder">{error && <p role="alert">{error}</p>}</div>
      <div style={{display:sidebarOpen ? 'contents' : 'none'}}><AssistantPanel/></div>
    </main>
  </div>
}
