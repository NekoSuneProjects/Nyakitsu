import { useEffect, useState } from 'react'
import type { TabInfo } from '../types'

export function useBrowserTabs() {
  const [tabs,setTabs] = useState<TabInfo[]>([])
  const [active,setActive] = useState<TabInfo | null>(null)
  const [error,setError] = useState('')
  useEffect(() => {
    let live = true
    window.nyakitsu.browser.listTabs().then((items) => { if (live) { setTabs(items); setActive(items.find((item) => item.active) || null) } }).catch((e) => setError(String(e)))
    const offTabs = window.nyakitsu.browser.onTabsChanged(setTabs)
    const offActive = window.nyakitsu.browser.onActiveTabChanged(setActive)
    return () => { live = false; offTabs(); offActive() }
  },[])
  return { tabs,active,error }
}
