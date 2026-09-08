import type { AgentApproval, AgentStep } from '../../types'

export function TaskActivity({ steps, approval, busy, resumable, onResume }: { steps: AgentStep[]; approval: AgentApproval | null; busy: boolean; resumable: boolean; onResume: () => void }) {
  return <section className="task-activity" aria-label="Browser task activity">
    <div className="task-controls">
      <strong>{busy ? 'Browser task running' : resumable ? 'Task paused' : 'Browser task'}</strong>
      {busy && <button className="secondary" onClick={() => window.nyakitsu.agent.stop()}>Stop task</button>}
      {!busy && resumable && <button className="secondary" onClick={onResume}>Resume task</button>}
    </div>
    {approval && <div className="approval" role="alert">
      <strong>{approval.message}</strong><p>{approval.details}</p>
      <div className="account-actions"><button className="primary" onClick={() => window.nyakitsu.agent.approve(approval.id,true)}>Allow</button><button className="secondary" onClick={() => window.nyakitsu.agent.approve(approval.id,false)}>Stop</button></div>
    </div>}
    {steps.length > 0 && <details open={Boolean(approval)}><summary>{steps.length} task steps</summary><ol>{steps.map((step,i) => <li key={i}>{step.text}</li>)}</ol></details>}
  </section>
}
