import { useEffect, useState } from 'react'
import type { AccountStatus } from '../../types'

export function AccountPanel() {
  const [status, setStatus] = useState<AccountStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function refresh() { setStatus(await window.nyakitsu.ai.account()) }
  useEffect(() => {
    let mounted = true
    const update = () => window.nyakitsu.ai.account().then((value) => { if (mounted) setStatus(value) }).catch((e) => { if (mounted) setError(String(e)) })
    update()
    const off = window.nyakitsu.ai.onAccountChanged((event) => { if (event.error) setError(event.error); update() })
    return () => { mounted = false; off() }
  }, [])
  async function act(action: () => Promise<unknown>) {
    setBusy(true); setError('')
    try { await action(); await refresh() } catch (e) { setError(String(e)) } finally { setBusy(false) }
  }
  return <section className="account-panel" aria-label="ChatGPT account">
    <strong>{status?.signedIn ? 'Connected to ChatGPT' : status?.pending ? 'Finish signing in in your browser' : 'Connect your ChatGPT account'}</strong>
    <p>{status?.signedIn ? `Plan: ${status.plan || 'available account plan'}` : 'Use the Codex access included with your eligible ChatGPT plan. No API key needed.'}</p>
    <div className="account-actions">
      {status?.signedIn
        ? <button className="secondary" disabled={busy} onClick={() => act(() => window.nyakitsu.ai.logout())}>Sign out</button>
        : status?.pending
          ? <button className="secondary" disabled={busy} onClick={() => act(() => window.nyakitsu.ai.cancelLogin())}>Cancel sign-in</button>
          : <button className="primary" disabled={busy} onClick={() => act(() => window.nyakitsu.ai.login())}>Sign in with ChatGPT</button>}
      <button className="secondary" disabled={busy} onClick={() => act(refresh)}>Check connection</button>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    <p className="hint">Sign-in opens OpenAI in your default browser. Your plan’s available models and usage limits apply.</p>
  </section>
}
