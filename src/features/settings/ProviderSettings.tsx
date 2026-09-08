import { useState } from 'react'
import type { AiSettings, ProviderInfo } from '../../types'
import { AccountPanel } from './AccountPanel'

export function ProviderSettings({ initial, providers, onSaved }: { initial: AiSettings; providers: ProviderInfo[]; onSaved: (value: AiSettings) => void }) {
  const [providerId, setProviderId] = useState(initial.providerId)
  const [model, setModel] = useState(initial.model)
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl)
  const [apiKey, setApiKey] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const provider = providers.find((p) => p.id === providerId)
  const subscription = providerId === 'chatgpt'
  function select(value: string) {
    setProviderId(value); setModels([]); setApiKey(''); setError('')
    setModel(value === initial.providerId ? initial.model : '')
    setBaseUrl(value === initial.providerId ? initial.baseUrl : providers.find((p) => p.id === value)?.baseUrl || '')
  }
  async function discover() {
    setBusy(true); setError('')
    try {
      const result = await window.nyakitsu.ai.models({ providerId, baseUrl, apiKey:apiKey || undefined })
      setModels(result); if (!model && result[0]) setModel(result[0])
    } catch (e) { setError(String(e)) } finally { setBusy(false) }
  }
  async function save() {
    setBusy(true); setError('')
    try { onSaved(await window.nyakitsu.ai.saveSettings({ providerId, model, baseUrl, apiKey:apiKey || undefined })) }
    catch (e) { setError(String(e)) } finally { setBusy(false) }
  }
  return <section className="settings-panel">
    <h3>AI connection</h3>
    <label>Provider<select value={providerId} disabled={busy} onChange={(e) => select(e.target.value)}>{providers.map((p) => <option key={p.id} value={p.id}>{p.name}{p.local ? ' · local' : ''}</option>)}</select></label>
    {subscription ? <AccountPanel /> : <>
      <label>Base URL<input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} /></label>
      <label>API key {provider?.keyRequired ? '' : '(optional)'}<input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={initial.hasApiKey && initial.providerId === providerId ? 'Saved key · enter to replace' : 'API key'} /></label>
      {providerId === 'anthropic' && <p className="hint">Claude uses API access here. Claude subscription sign-in in third-party apps requires Anthropic approval.</p>}
    </>}
    <div className="model-row"><label>Model<input list="nyakitsu-models" value={model} onChange={(e) => setModel(e.target.value)} placeholder={subscription ? 'Account default (optional)' : 'Model ID'} /></label><button className="secondary" disabled={busy} onClick={discover}>Discover</button></div>
    <datalist id="nyakitsu-models">{models.map((item) => <option key={item} value={item} />)}</datalist>
    {!subscription && <p className="hint">Keys stay in the browser’s main process and are saved separately for each provider.</p>}
    {error && <p className="error" role="alert">{error}</p>}
    <button className="primary" disabled={busy || (!subscription && !model.trim())} onClick={save}>Save connection</button>
  </section>
}
