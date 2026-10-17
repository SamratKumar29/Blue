import { useState } from 'react';
import { RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useBlueStore } from '../../store';
import { useUi } from '../../ui';
import Modal, { btnGhost, btnPrimary } from '../Modal';
import BlueMascot from '../BlueMascot';
import { Aborted, RedoConfirm } from './AbortFlow';
import { generateRoundup } from '../../core/features/roundup';
import { chipLabel } from '../../core/connectors/demoWorkspace';
import { friendlyAiError } from '../../core/ai/run';
import { now } from '../../core/presence/demoClock';
import { GROUP_META, greeting } from '../ui';

type Step = 'kickoff' | 'permission' | 'redo' | 'aborted' | 'working' | 'results';

const PILLARS = [
  ['🟢', 'Keep you on track', 'Gentle reminders and smart prioritization of your tasks.'],
  ['🟣', 'Reduce stress', 'Break big tasks into smaller steps and offer support when you need it.'],
  ['🔵', 'Save you time', 'Summarize updates, find what matters, and eliminate busy work.'],
  ['🔴', 'Boost your focus', 'Encourage healthy breaks and celebrate your progress.'],
];

export default function RoundupDialog() {
  const { settings, meta, tasks, summaries } = useBlueStore();
  const closeDialog = useUi((s) => s.closeDialog);
  const todays = summaries.find((s) => s.kind === 'roundup' && new Date(s.at).toDateString() === now().toDateString());
  const [step, setStep] = useState<Step>(todays ? 'results' : 'kickoff');
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState<{ text: string; group: string; source: string; ref: string }[] | null>(null);

  const stored = todays
    ? todays.text.split('\n').map((text, i) => ({ text, source: todays.sources[i]?.source ?? 'manual', ref: todays.sources[i]?.ref ?? '', group: tasks.find((t) => t.provenance?.ref === todays.sources[i]?.ref)?.group ?? 'next_up' }))
    : [];
  const lines = fresh ?? stored;

  const open = tasks.filter((t) => t.status === 'todo');
  const count = (g: string) => open.filter((t) => t.group === g);
  const sourcesOn = [settings.allowConnectors && meta.sources['demo-slack'] && 'Slack', settings.allowConnectors && meta.sources['demo-gmail'] && 'Gmail', settings.allowConnectors && meta.sources['demo-calendar'] && 'Calendar'].filter(Boolean) as string[];

  const run = async () => {
    setStep('working'); setError(null);
    try {
      const r = await generateRoundup();
      setFresh(r.lines);
      setStep('results');
    } catch (e) {
      setError(e instanceof Error && !(e.name === 'AiError') ? e.message : friendlyAiError(e));
      setStep('permission');
    }
  };

  const summary = `You have ${count('easy_wins').length} easy wins, ${count('next_up').length} next up, and ${count('needs_senior').length} that could use senior help.`;

  return (
    <Modal title="Your roundup" subtitle="A calm start to the day" mood={step === 'working' ? 'working' : 'happy'} onClose={closeDialog} wide
      hideHeader={step === 'kickoff' || step === 'redo' || step === 'aborted'}
    >
      {step === 'kickoff' && (
        <div className="text-center">
          <div className="relative mx-auto flex w-fit flex-col items-center">
            <BlueMascot size={150} mood="happy" float />
            <span className="mt-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">You're all set for the day!</span>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-ink">Good {greeting(now(), settings.timezone)}, {settings.name.split(' ')[0]}! ☀️</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">A fresh day brings new opportunities. Let's get you ready for a productive and fulfilling day!</p>
          <ul className="mx-auto mt-5 grid max-w-xl gap-3 text-left sm:grid-cols-2">
            {PILLARS.map(([e, t, d]) => (
              <li key={t} className="rounded-2xl border border-slate-100 p-3"><p className="text-sm font-semibold text-ink">{e} {t}</p><p className="mt-0.5 text-xs text-muted">{d}</p></li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-muted">A calm mind, a clear plan, and a little support go a long way. 💙</p>
          <button onClick={() => setStep('permission')} className={`${btnPrimary} mt-4 px-8 py-3`}>▶ Let's make it a great day!</button>
        </div>
      )}

      {step === 'permission' && (
        <div>
          <div className="flex items-start gap-4">
            <BlueMascot size={84} mood="happy" />
            <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-800">Here's what I'll do, {settings.name.split(' ')[0]}! I'll read only the sources you've approved, group your tasks by priority and context, and show you the result. Please review and give me permission to proceed.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {([['easy_wins', 'High priority & quick'], ['next_up', 'Next up'], ['needs_senior', 'Needs senior help']] as const).map(([g, label], i) => (
              <div key={g} className="rounded-2xl border border-slate-100 p-3">
                <p className="text-sm font-semibold text-ink"><span className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] text-white ${GROUP_META[g].dot}`}>{i + 1}</span>{label}</p>
                <p className="text-xs text-muted">{count(g).length} task{count(g).length === 1 ? '' : 's'} so far</p>
                <ul className="mt-1 space-y-0.5 text-xs text-ink">{count(g).slice(0, 2).map((t) => <li key={t.id} className="truncate">• {t.title}</li>)}</ul>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-slate-100 p-3 text-sm">
            <p className="mb-1 font-semibold text-ink">Connector status</p>
            {sourcesOn.length ? (
              <ul className="flex flex-wrap gap-2">
                {sourcesOn.map((s) => <li key={s} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"><CheckCircle2 size={13} /> {s} · {s === 'Calendar' ? 'propose slots' : s === 'Gmail' ? 'read + summarize' : 'summarize'} (read-only)</li>)}
              </ul>
            ) : <p className="text-amber-600">No sources are switched on. Enable the Demo Workspace in Settings first.</p>}
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-rose-500">{error}</p>}
          <div className="mt-5 flex justify-between gap-3">
            <button onClick={() => setStep('redo')} className={btnGhost}>Abort</button>
            <button onClick={run} className={`${btnPrimary} inline-flex items-center gap-2`}><CheckCircle2 size={16} /> Allow</button>
          </div>
        </div>
      )}

      {step === 'working' && (
        <div className="flex flex-col items-center py-10 text-center">
          <BlueMascot size={130} mood="working" float />
          <p className="mt-4 font-semibold text-ink">Reading what you approved…</p>
          <p className="text-sm text-muted">Filtering secrets and code, then sorting your day.</p>
        </div>
      )}

      {step === 'redo' && <RedoConfirm onRedo={() => setStep('permission')} onContinue={() => setStep('aborted')} />}
      {step === 'aborted' && <Aborted onDone={closeDialog} />}

      {step === 'results' && (
        <div>
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="text-xl font-bold text-ink">Your day, simplified</h2><p className="text-sm text-muted">{summary}</p></div>
            <button onClick={() => setStep('permission')} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50"><RefreshCw size={13} /> Refresh</button>
          </div>
          <ul className="mt-4 space-y-2">
            {lines.length === 0 && <li className="text-sm text-muted">Nothing to show yet.</li>}
            {lines.map((l, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 text-sm">
                <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${GROUP_META[l.group as keyof typeof GROUP_META]?.dot ?? 'bg-slate-300'}`} aria-hidden="true" />
                <span className="flex-1 text-ink">{l.text}</span>
                <span className="flex-shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-600">{chipLabel(l.source, l.ref)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted"><ShieldCheck size={14} /> Based on: {sourcesOn.join(', ') || 'your tasks'} (read-only). Raw messages are never stored.</p>
          <div className="mt-4 flex justify-end"><button onClick={closeDialog} className={btnPrimary}>Done</button></div>
        </div>
      )}
    </Modal>
  );
}
