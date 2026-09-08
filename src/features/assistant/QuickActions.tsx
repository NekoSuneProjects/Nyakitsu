import { MessageSquareText, Sparkles, Zap } from 'lucide-react'

export function QuickActions({ disabled,onAsk }: { disabled: boolean; onAsk: (text: string) => void }) {
  return <div className="quick-actions">
    <button disabled={disabled} onClick={() => onAsk('Summarize the current page with the important points and useful links.')}><MessageSquareText size={16}/> Summarize</button>
    <button disabled={disabled} onClick={() => onAsk('Explain the selected text, or the main topic if nothing is selected.')}><Zap size={16}/> Explain</button>
    <button disabled={disabled} onClick={() => onAsk('What can I usefully do next on this page?')}><Sparkles size={16}/> What next?</button>
  </div>
}
