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
  family: 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'codex'
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

export type AccountStatus = { signedIn: boolean; plan: string | null; pending: boolean }
export type AgentStep = { step: number; action: string; text: string }
export type AgentApproval = { id: string; message: string; details: string }
export type AgentResult = { text: string; resumable: boolean }

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
        account(): Promise<AccountStatus>
        login(): Promise<{ pending: boolean }>
        cancelLogin(): Promise<void>
        logout(): Promise<void>
        onAccountChanged(callback: (state: { error: string | null }) => void): () => void
        providers(): Promise<ProviderInfo[]>
        settings(): Promise<AiSettings>
        saveSettings(settings: { providerId: string; model: string; baseUrl?: string; apiKey?: string }): Promise<AiSettings>
        models(input?: { providerId?: string; baseUrl?: string; apiKey?: string }): Promise<string[]>
        chat(input: { messages: Array<{ role: 'user' | 'assistant'; content: string }>; includePage?: boolean }): Promise<{ text: string }>
      }
      agent: {
        run(input: { messages: Array<{ role: 'user' | 'assistant'; content: string }> }): Promise<AgentResult>
        resume(): Promise<AgentResult>
        stop(): Promise<void>
        approve(id: string, allow: boolean): Promise<void>
        onStep(callback: (step: AgentStep) => void): () => void
        onApproval(callback: (approval: AgentApproval | null) => void): () => void
      }
    }
  }
}
