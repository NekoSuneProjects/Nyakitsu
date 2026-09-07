export type TabInfo = {
  id: number
  title: string
  url: string
  favicon?: string
  loading: boolean
  canGoBack: boolean
  canGoForward: boolean
  active?: boolean
}

export type ProviderInfo = {
  id: string
  name: string
  family: 'openai' | 'anthropic' | 'gemini' | 'ollama'
  baseUrl: string
  keyRequired: boolean
  freeTier?: boolean
  local?: boolean
  notes?: string
}

export type AiSettings = {
  providerId: string
  model: string
  baseUrl: string
  hasApiKey: boolean
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

declare global {
  interface Window {
    nyakitsu: {
      browser: {
        listTabs(): Promise<TabInfo[]>
        newTab(url?: string): Promise<TabInfo>
        closeTab(id: number): Promise<void>
        activateTab(id: number): Promise<void>
        navigate(input: string): Promise<void>
        back(): Promise<void>
        forward(): Promise<void>
        reload(): Promise<void>
        stop(): Promise<void>
        getPageContext(): Promise<{ title: string; url: string; text: string; selection: string }>
        setLayout(layout: { top: number; right: number }): Promise<void>
        onTabsChanged(callback: (tabs: TabInfo[]) => void): () => void
        onActiveTabChanged(callback: (tab: TabInfo | null) => void): () => void
      }
      ai: {
        providers(): Promise<ProviderInfo[]>
        settings(): Promise<AiSettings>
        saveSettings(settings: { providerId: string; model: string; baseUrl?: string; apiKey?: string }): Promise<AiSettings>
        models(input?: { providerId?: string; baseUrl?: string; apiKey?: string }): Promise<string[]>
        chat(input: { messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>; includePage?: boolean }): Promise<{ text: string }>
      }
    }
  }
}
