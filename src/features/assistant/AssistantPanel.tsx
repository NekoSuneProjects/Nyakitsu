import { useEffect, useRef, useState } from 'react'
import { Bot, LoaderCircle, Send, Settings2 } from 'lucide-react'
import type { AgentApproval, AgentStep, AiSettings, ChatMessage, ProviderInfo } from '../../types'
import { ProviderSettings } from '../settings/ProviderSettings'
import { TaskActivity } from './TaskActivity'
import { QuickActions } from './QuickActions'

export function AssistantPanel() {
  const [settings, setSettings] = useState<AiSettings | null>(null)
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mode, setMode] = useState<'chat' | 'task'>('task')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [resumable, setResumable] = useState(false)
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [approval, setApproval] = useState<AgentApproval | null>(null)
  const end = useRef<HTMLDivElement>(null)
  function append(content: string) { setMessages((items) => [...items,{ id:crypto.randomUUID(),role:'assistant',content }]) }
  useEffect(() => {
    Promise.all([window.nyakitsu.ai.settings(),window.nyakitsu.ai.providers()]).then(([s,p]) => { setSettings(s); setProviders(p); if (!s.model && s.providerId === 'chatgpt') setSettingsOpen(true) }).catch((e) => append(String(e)))
    const offStep = window.nyakitsu.agent.onStep((step) => setSteps((items) => [...items,step]))
    const offApproval = window.nyakitsu.agent.onApproval(setApproval)
    return () => { offStep(); offApproval() }
  }, [])
  useEffect(() => { end.current?.scrollIntoView({ behavior:'smooth' }) },[messages,busy])
  async function send(resume = false, text = prompt) {
    if (busy || (!resume && !text.trim())) return
    const next: ChatMessage[] = resume ? messages : [...messages,{ id:crypto.randomUUID(),role:'user',content:text.trim() }]
    setMessages(next); setPrompt(''); setBusy(true)
    if (!resume && mode === 'task') { setSteps([]); setResumable(false) }
    try {
      const input = { messages:next.slice(-12).map(({role,content}) => ({role,content})) }
      if (mode === 'task' || resume) {
        const result = resume ? await window.nyakitsu.agent.resume() : await window.nyakitsu.agent.run(input)
        append(result.text); setResumable(result.resumable)
      } else append((await window.nyakitsu.ai.chat({ ...input,includePage:true })).text)
    } catch (e) { append(String(e)) } finally { setBusy(false); setApproval(null) }
  }
  const provider = providers.find((p) => p.id === settings?.providerId)
  return <aside className="ai-sidebar">
    <div className="assistant-header">
      <div><div className="assistant-title"><Bot size={19} /> Nyakitsu AI</div><small>{provider?.name || 'Loading connection'} · {settings?.model || 'account default'}</small></div>
      <button className="icon-button" title="AI settings" disabled={busy} onClick={() => setSettingsOpen((value) => !value)}><Settings2 size={17} /></button>
    </div>
    {settingsOpen && settings ? <ProviderSettings initial={settings} providers={providers} onSaved={(value) => { setSettings(value); setSettingsOpen(false) }} /> : <>
      <div className="mode-switch" role="group" aria-label="Assistant mode"><button className={mode === 'task' ? 'selected' : ''} disabled={busy} onClick={() => setMode('task')}>Browser task</button><button className={mode === 'chat' ? 'selected' : ''} disabled={busy} onClick={() => setMode('chat')}>Ask about page</button></div>
      {mode === 'task' && <TaskActivity steps={steps} approval={approval} busy={busy} resumable={resumable} onResume={() => send(true)} />}
      {mode === 'chat' && <QuickActions disabled={busy} onAsk={(text) => send(false,text)} />}
      <div className="messages">
        {!messages.length && <div className="message assistant"><p>{mode === 'task' ? 'Give me a browser task. I can open websites, read pages and interact with their controls. I’ll show actions here and pause when your input is needed.' : 'Ask for a summary or explanation of the current page.'}</p></div>}
        {messages.map((message) => <div key={message.id} className={`message ${message.role}`}><span>{message.role === 'assistant' ? 'NYA' : 'YOU'}</span><p>{message.content}</p></div>)}
        {busy && <div className="message assistant"><p className="thinking"><LoaderCircle className="spin" size={15}/>{approval ? 'Waiting for your decision…' : 'Working…'}</p></div>}
        <div ref={end}/>
      </div>
      <form className="composer" onSubmit={(e) => { e.preventDefault(); send() }}>
        <textarea aria-label="Message" rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={mode === 'task' ? 'Open a website and check something…' : 'Ask about this page…'} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
        <button aria-label="Send message" disabled={busy || !settings || !prompt.trim()}><Send size={17}/></button>
      </form>
    </>}
  </aside>
}
