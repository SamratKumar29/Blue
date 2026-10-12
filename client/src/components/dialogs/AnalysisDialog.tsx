import { useState } from 'react';
import { FileText, Check, X, Volume2 } from 'lucide-react';
import { useBlueStore } from '../../store';
import { useUi } from '../../ui';
import Modal, { btnGhost, btnPrimary } from '../Modal';
import { Aborted, RedoConfirm } from './AbortFlow';
import { breakDownTask } from '../../core/features/checkin';
import { friendlyAiError } from '../../core/ai/run';
import type { Task } from '../../core/types';
import { speak } from '../speak';

function analyse(t: Task) {
  const complexity = t.effort === 'deep' || t.estimateMin >= 90 ? { label: 'High', cls: 'bg-rose-50 text-rose-500', text: 'Needs domain knowledge and probably several systems.' }
    : t.effort === 'medium' ? { label: 'Moderate', cls: 'bg-amber-50 text-amber-600', text: 'Needs focused time but is well understood.' }
    : { label: 'Low', cls: 'bg-emerald-50 text-emerald-600', text: 'Small and self-contained.' };
  const llm = t.group === 'needs_senior' ? { label: 'Possible', cls: 'bg-blue-50 text-blue-600', text: 'Useful for research, ideas and drafting; not for final decisions.' }
    : { label: 'Yes', cls: 'bg-emerald-50 text-emerald-600', text: 'Good for drafting and breaking the work into steps.' };
  const senior = t.group === 'needs_senior' ? { label: 'Likely', cls: 'bg-amber-50 text-amber-600', text: t.blocker ?? 'Final decisions or access are with someone else.' }
    : { label: 'Unlikely', cls: 'bg-slate-100 text-muted', text: 'You can likely do this yourself.' };
  return { complexity, llm, senior };
}

export default function AnalysisDialog({ taskId }: { taskId?: string }) {
  const task = useBlueStore((s) => s.tasks.find((t) => t.id === taskId));
  const { closeDialog, openDialog } = useUi();
  const [step, setStep] = useState<'plan' | 'redo' | 'aborted' | 'steps'>('plan');
  const [steps, setSteps] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!task) return null;
  const a = analyse(task);
  const needsSenior = task.group === 'needs_senior';

  const proceed = async () => {
    if (needsSenior) { openDialog('askSenior', { taskId: task.id }); return; }
    setBusy(true); setError(null);
    try { setSteps(await breakDownTask(task.title)); setStep('steps'); }
    catch (e) { setError(friendlyAiError(e)); }
    finally { setBusy(false); }
  };

  const summaryText = `${task.title}. Complexity ${a.complexity.label}. ${needsSenior ? 'A senior can help.' : 'You can start now.'}`;

  return (
    <Modal
      title="Blue"
      subtitle={busy ? 'Thinking. Analyzing. Finding the best way…' : 'Thinking. Analyzing. Finding the best way...'}
      mood={busy ? 'working' : 'thinking'}
      onClose={closeDialog}
      footer={step === 'plan' ? (
        <>
          <button onClick={() => speak(summaryText)} aria-label="Read this aloud" className="mr-auto rounded-xl p-2.5 text-muted hover:bg-slate-100"><Volume2 size={18} /></button>
          <button onClick={proceed} disabled={busy} className={`${btnPrimary} inline-flex items-center gap-2`}><Check size={16} /> {busy ? 'Working…' : 'Yes, proceed'}</button>
          <button onClick={() => setStep('redo')} className={`${btnGhost} inline-flex items-center gap-2`}><X size={16} /> No, abort</button>
        </>
      ) : undefined}
    >
      {step === 'plan' && (
        <div className="space-y-4">
          <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-800">Got it! Let me analyze this task and figure out the best way to help you.</p>
          <div className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500"><FileText size={20} /></span>
            <div><p className="font-semibold text-ink">{task.title}</p><p className="text-xs text-muted">{task.project} · {task.explanation.reason}</p></div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">My Analysis</h3>
            <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-100 text-sm">
              {[['Task complexity', a.complexity], ['Can Frontier LLMs help?', a.llm], ['Need a senior expert?', a.senior]].map(([q, v]) => {
                const x = v as typeof a.complexity;
                return (
                  <li key={q as string} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div><p className="font-medium text-ink">{q as string}</p><p className="text-xs text-muted">{x.text}</p></div>
                    <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${x.cls}`}>{x.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">What I'll do (with your permission)</h3>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-ink">
              <li>Use a language model to draft a small-steps plan{task.blocker ? ' and a clear help request' : ''}.</li>
              <li>{needsSenior ? 'Help you ask the right senior colleague, with your approval of the exact message.' : 'Keep everything on your side; nothing is shared with anyone.'}</li>
              <li>Keep your data private. Only a task summary is used, never raw messages.</li>
            </ol>
          </div>
          <p className="text-sm text-muted">I won't take any action (like scheduling or sharing) without your explicit permission. Would you like me to proceed with this plan?</p>
          {error && <p role="alert" className="text-sm text-rose-500">{error}</p>}
        </div>
      )}
      {step === 'steps' && (
        <div>
          <p className="mb-3 text-sm text-muted">Here is a small-steps plan. Nothing was shared or changed.</p>
          <ol className="space-y-2">
            {steps.map((s, i) => <li key={i} className="flex gap-3 rounded-xl border border-slate-100 p-3 text-sm"><span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">{i + 1}</span>{s}</li>)}
          </ol>
          <div className="mt-5 flex justify-end"><button onClick={closeDialog} className={btnPrimary}>Got it</button></div>
        </div>
      )}
      {step === 'redo' && <RedoConfirm onRedo={() => setStep('plan')} onContinue={() => setStep('aborted')} />}
      {step === 'aborted' && <Aborted onDone={closeDialog} />}
    </Modal>
  );
}
