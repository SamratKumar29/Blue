import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Coffee, MessageCircle } from 'lucide-react';
import { useBlueStore } from '../../store';
import { useUi } from '../../ui';
import Modal, { btnGhost, btnPrimary } from '../Modal';
import BlueMascot from '../BlueMascot';
import { breakDownTask } from '../../core/features/checkin';
import { friendlyAiError } from '../../core/ai/run';

// Private by design: mood choices only pick a pre-written, supportive reply on this device.
// Nothing is inferred, scored, sent anywhere or stored unless the user taps Save.
const EMOJI = [['😄', 'Great'], ['😐', 'Okay'], ['😕', 'A bit tired'], ['☹️', 'Stressed']] as const;
const REPLY: Record<string, string> = {
  Great: 'Lovely. Want to use the good energy on something that has been waiting?',
  Okay: 'Okay is a fine place to start. One small step is plenty.',
  'A bit tired': 'Thanks for saying so. A short break, some water and one easy task could help.',
  Stressed: 'That sounds like a lot. We can shrink it: pick one task and I will break it into tiny steps.',
};
const SUPPORT: Record<string, string> = {
  Motivation: 'Small steps still count. Pick the smallest useful thing and give it 15 minutes.',
  'Break suggestion': 'Stand up, stretch, drink some water and look at something far away for a minute.',
  'Just chat': 'I am here. Tell me what is on your mind, or ask me about your day.',
};

function FocusTimer() {
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => setLeft((l) => (l <= 1 ? (setRunning(false), 0) : l - 1)), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <p className="text-sm font-semibold text-ink">25-minute focus timer</p>
      <p role="timer" aria-live="off" className="my-2 text-4xl font-bold tabular-nums text-blue-600">{mm}:{ss}</p>
      <div className="flex gap-2">
        <button onClick={() => setRunning(!running)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">{running ? <Pause size={13} /> : <Play size={13} />} {running ? 'Pause' : left === 25 * 60 ? 'Start' : 'Resume'}</button>
        <button onClick={() => { setRunning(false); setLeft(25 * 60); }} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-ink"><RotateCcw size={13} /> Restart after a distraction</button>
      </div>
      {left === 0 && <p className="mt-2 text-sm text-good">Nice focus block. Take a short break.</p>}
    </div>
  );
}

export default function CheckinDialog() {
  const close = useUi((s) => s.closeDialog);
  const { settings, tasks, addSummary } = useBlueStore();
  const [mood, setMood] = useState<string | null>(null);
  const [support, setSupport] = useState<string | null>(null);
  const [taskId, setTaskId] = useState(tasks.find((t) => t.status === 'todo')?.id ?? '');
  const [steps, setSteps] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!settings.checkins) {
    return <Modal title="Check-ins are off" onClose={close}><p className="text-sm text-muted">You turned check-ins off in Settings &gt; Notifications. Nothing to do here.</p></Modal>;
  }
  const open = tasks.filter((t) => t.status === 'todo');
  const breakIt = async () => {
    const t = open.find((x) => x.id === taskId);
    if (!t) return;
    setBusy(true); setError(null);
    try { setSteps(await breakDownTask(t.title)); } catch (e) { setError(friendlyAiError(e)); } finally { setBusy(false); }
  };

  return (
    <Modal title={`Hey ${settings.name.split(' ')[0]}! 👋`} subtitle="Private, optional, skippable" mood="encouraging" onClose={close} wide
      footer={<button onClick={close} className={btnGhost}>Skip for now</button>}>
      <div className="flex items-center gap-4">
        <BlueMascot size={96} mood="encouraging" float />
        <div><p className="text-lg font-semibold text-ink">Just checking in on you. How are you feeling today?</p><p className="text-sm text-muted">No pressure! Just a quick check-in. Your well-being matters. 💙</p></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="How are you feeling">
        {EMOJI.map(([e, label]) => (
          <button key={label} role="radio" aria-checked={mood === label} onClick={() => setMood(label)}
            className={`rounded-2xl border p-3 text-center transition ${mood === label ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:bg-slate-50'}`}>
            <span className="block text-2xl" aria-hidden="true">{e}</span><span className="text-sm font-medium text-ink">{label}</span>
          </button>
        ))}
      </div>
      {mood && <p className="mt-3 rounded-xl bg-blue-50 px-4 py-2 text-sm text-blue-800 animate-pop">{REPLY[mood]}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {([['Motivation', Sparkles], ['Break suggestion', Coffee], ['Just chat', MessageCircle]] as const).map(([label, Icon]) => (
          <button key={label} onClick={() => setSupport(label)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-ink hover:bg-slate-50"><Icon size={14} /> {label}</button>
        ))}
      </div>
      {support && <p className="mt-3 rounded-xl bg-slate-50 px-4 py-2 text-sm text-ink animate-pop">{SUPPORT[support]}</p>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FocusTimer />
        <div className="rounded-2xl border border-slate-100 p-4">
          <p className="text-sm font-semibold text-ink">Break a task into small steps</p>
          <select value={taskId} onChange={(e) => setTaskId(e.target.value)} aria-label="Task to break down" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
            {open.length === 0 && <option value="">No open tasks</option>}
            {open.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <button onClick={breakIt} disabled={busy || !taskId} className={`${btnPrimary} mt-2 w-full`}>{busy ? 'Thinking…' : 'Make it smaller'}</button>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-rose-500">{error}</p>}
      {steps && (
        <div className="mt-4 animate-pop">
          <ol className="space-y-2">{steps.map((s, i) => <li key={i} className="flex gap-3 rounded-xl border border-slate-100 p-3 text-sm"><span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">{i + 1}</span>{s}</li>)}</ol>
          <button disabled={saved} onClick={async () => { await addSummary({ kind: 'note', text: steps.join('\n'), sources: [{ source: 'manual', ref: taskId }] }); setSaved(true); }} className="mt-3 text-xs font-semibold text-blue-600 hover:underline disabled:text-muted disabled:no-underline">{saved ? 'Saved to your notes' : 'Save these steps (otherwise nothing is kept)'}</button>
        </div>
      )}
    </Modal>
  );
}
