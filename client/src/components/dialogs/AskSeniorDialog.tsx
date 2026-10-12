import { useEffect, useMemo, useState } from 'react';
import { Send, Lock, Calendar as CalIcon, Video, Loader2, CheckCircle2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBlueStore } from '../../store';
import { useUi } from '../../ui';
import Modal, { btnGhost, btnPrimary } from '../Modal';
import BlueMascot from '../BlueMascot';
import { guard } from '../../core/policy/useGate';
import { hashAction } from '../../core/policy/gate';
import { TEAM, draftHelpRequest, suggestHelper } from '../../core/features/askSenior';
import { draftMessage } from '../../core/features/draft';
import { nextSlot, isBusy, type Slot } from '../../core/features/schedule';
import { friendlyAiError } from '../../core/ai/run';
import { now } from '../../core/presence/demoClock';
import type { Task, TeamMember } from '../../core/types';

type Step = 'compose' | 'sent' | 'response' | 'checking' | 'proposal' | 'scheduled' | 'calendar' | 'busy';

const SHARED = ['Task details and goals', 'Relevant background and context', 'Suggested approach and questions', 'Deadline and priority'];

export default function AskSeniorDialog({ taskId, helperId }: { taskId?: string; helperId?: string }) {
  const { tasks, settings, addOutbox, updateSettings } = useBlueStore();
  const closeDialog = useUi((s) => s.closeDialog);
  const nav = useNavigate();

  const open = tasks.filter((t) => t.status === 'todo');
  const [chosenId, setChosenId] = useState<string | undefined>(taskId ?? open.find((t) => t.group === 'needs_senior')?.id ?? open[0]?.id);
  const task: Task | undefined = tasks.find((t) => t.id === chosenId);
  const suggestion = useMemo(() => (task ? suggestHelper(task) : { member: TEAM[0], why: '' }), [task]);
  const [helper, setHelper] = useState<TeamMember>(TEAM.find((m) => m.id === helperId) ?? suggestion.member);
  const [why, setWhy] = useState(suggestion.why);

  const [step, setStep] = useState<Step>('compose');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [writeOff, setWriteOff] = useState(false);
  const [slot, setSlot] = useState<Slot>(() => nextSlot(now()));
  const [managerNote, setManagerNote] = useState<string | null>(null);
  const [sentToManager, setSentToManager] = useState(false);

  const manager = TEAM.find((m) => /lead|manager/i.test(m.role) && m.id !== helper.id) ?? TEAM[0];

  const draft = async (h: TeamMember) => {
    if (!task) return;
    setBusy(true); setError(null);
    try { setText((await draftHelpRequest(task, h)).text); }
    catch (e) { setError(friendlyAiError(e)); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (task) { const s = suggestHelper(task); if (!helperId) { setHelper(s.member); } setWhy(s.why); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenId]);
  useEffect(() => { draft(helper); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [chosenId, helper.id]);
  useEffect(() => {
    if (step !== 'checking') return;
    const t = setTimeout(() => setStep('proposal'), 1400);
    return () => clearTimeout(t);
  }, [step]);

  const send = async (recipient: TeamMember, content: string, next: () => void) => {
    setError(null); setWriteOff(false);
    const r = await guard(
      { type: 'send_message', recipient: recipient.name, content, effect: 'Send message' },
      async (final) => {
        await addOutbox({ recipient: final.recipient!, content: final.content!, approvedHash: await hashAction(final), kind: 'message' });
      },
      { editable: true },
    );
    if (r.ok) next();
    else if (!r.cancelled) { setError(r.reason); setWriteOff(r.reason === 'Write actions are off.'); }
  };

  const schedule = async () => {
    setError(null); setWriteOff(false);
    const content = `Meeting: ${task?.title ?? 'Help session'}\nWith: ${helper.name}\nWhen: ${slot.label}\nWhere: Google Meet (demo)\nShared: task summary only, no raw data`;
    const r = await guard({ type: 'create_event', recipient: helper.name, content, effect: 'Create calendar event' }, async (final) => {
      await addOutbox({ recipient: helper.name, content: final.content!, approvedHash: await hashAction(final), kind: 'event', when: slot.start.toISOString() });
    });
    if (r.ok) setStep('scheduled');
    else if (!r.cancelled) { setError(r.reason); setWriteOff(r.reason === 'Write actions are off.'); }
  };

  const draftManager = async () => {
    setBusy(true); setError(null);
    try {
      setManagerNote(await draftMessage(`Quick heads-up: I'm blocked on "${task?.title}"${task?.blocker ? ` (${task.blocker})` : ''} and ${helper.name.split(' ')[0]} is not available soon. Could you take a quick look at my summary and advise?`, manager.name));
    } catch (e) { setError(friendlyAiError(e)); }
    finally { setBusy(false); }
  };

  const others = TEAM.filter((m) => m.id !== helper.id && !/product manager/i.test(m.role)).slice(0, 4);
  const day = nextSlot(now()).start;
  const enableWriting = (
    writeOff && <button onClick={async () => { await updateSettings({ allowWriting: true }); setWriteOff(false); setError(null); }} className="mt-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100">Turn on writing (I will still ask every time)</button>
  );

  if (!task) {
    return <Modal title="Ask a senior" onClose={closeDialog}><p className="text-sm text-muted">You have no open tasks to ask about. Add a task first, then I can help you ask for help early.</p></Modal>;
  }

  return (
    <Modal title="Ask a senior" subtitle="Asking early is a strength" mood={step === 'checking' ? 'working' : step === 'scheduled' ? 'excited' : 'encouraging'} onClose={closeDialog} wide>
      {step === 'compose' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm"><span className="mb-1 block font-medium text-ink">About which task?</span>
              <select value={chosenId} onChange={(e) => setChosenId(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                {open.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </label>
            <label className="text-sm"><span className="mb-1 block font-medium text-ink">Who could help?</span>
              <select value={helper.id} onChange={(e) => setHelper(TEAM.find((m) => m.id === e.target.value)!)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                {TEAM.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
              </select>
            </label>
          </div>
          <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700"><strong>Why this person:</strong> {why || `${helper.role}`}</p>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink">Your request (edit anything)</span>
            <textarea value={busy ? 'Drafting…' : text} onChange={(e) => setText(e.target.value)} disabled={busy} rows={12} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500" />
          </label>
          {error && <div role="alert" className="text-sm text-rose-500">{error}<div>{enableWriting}</div></div>}
          <div className="flex justify-between gap-3">
            <button onClick={closeDialog} className={btnGhost}>Not now</button>
            <button disabled={busy || !text.trim()} onClick={() => send(helper, text, () => setStep('sent'))} className={`${btnPrimary} inline-flex items-center gap-2`}><Send size={16} /> Review &amp; send</button>
          </div>
        </div>
      )}

      {step === 'sent' && (
        <div>
          <h3 className="text-lg font-bold text-ink">Step 1 · Request sent to {helper.name.split(' ')[0]}</h3>
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">{helper.name.split(' ').map((p) => p[0]).join('')}</div>
            <div className="flex-1"><p className="font-semibold text-ink">{helper.name}</p><p className="text-xs text-muted">{helper.role}</p></div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">Request sent</span>
          </div>
          <h4 className="mt-4 text-sm font-semibold text-ink">What was shared</h4>
          <ul className="mt-1 grid gap-1.5 sm:grid-cols-2">{SHARED.map((s) => <li key={s} className="flex items-center gap-2 text-sm text-ink"><CheckCircle2 size={15} className="text-good" /> {s}</li>)}</ul>
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700"><Lock size={14} /> Your data stays private. Only what's needed is shared with {helper.name.split(' ')[0]}. Demo: nothing is actually sent.</p>
          <div className="mt-5 flex justify-end"><button onClick={() => setStep('response')} className={btnPrimary}>Show {helper.name.split(' ')[0]}'s reply (simulated)</button></div>
        </div>
      )}

      {step === 'response' && (
        <div>
          <h3 className="text-lg font-bold text-ink">Step 2 · {helper.name.split(' ')[0]} receives &amp; responds</h3>
          <p className="text-xs text-muted">Simulated for the demo. In a real rollout this is {helper.name.split(' ')[0]}'s own Blue.</p>
          <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
            <p className="font-semibold text-ink">Blue has requested your help</p>
            <p className="mt-1 text-muted">Hi {helper.name.split(' ')[0]}! {settings.name.split(' ')[0]} could use your expertise on "{task.title}".</p>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button onClick={() => setStep('busy')} className={btnGhost}>Decline</button>
            <button onClick={() => setStep('checking')} className={btnPrimary}>Accept</button>
          </div>
        </div>
      )}

      {step === 'checking' && (
        <div className="flex flex-col items-center py-8 text-center">
          <BlueMascot size={120} mood="excited" />
          <p className="mt-3 font-semibold text-ink">Great news! {helper.name.split(' ')[0]} accepted your request.</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted"><Loader2 size={16} className="animate-spin" /> Checking {helper.name.split(' ')[0]}'s calendar…</p>
        </div>
      )}

      {step === 'proposal' && (
        <div>
          <h3 className="text-lg font-bold text-ink">Step 4 · Proposed meeting (needs your approval)</h3>
          <div className="mt-3 space-y-2 rounded-2xl border border-slate-100 p-4 text-sm">
            <p className="font-semibold text-ink">Discussion: {task.title}</p>
            <p className="flex items-center gap-2 text-muted"><Users size={15} /> With {helper.name}</p>
            <p className="flex items-center gap-2 text-muted"><CalIcon size={15} /> {slot.label}</p>
            <p className="flex items-center gap-2 text-muted"><Video size={15} /> Google Meet (demo)</p>
            <p className="pt-1 text-xs text-muted">Meeting context: relevant docs and a summary only, no raw data.</p>
          </div>
          {error && <div role="alert" className="mt-3 text-sm text-rose-500">{error}<div>{enableWriting}</div></div>}
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={closeDialog} className={btnGhost}>Not now</button>
            <button onClick={schedule} className={`${btnPrimary} inline-flex items-center gap-2`}><CalIcon size={16} /> Allow &amp; Schedule</button>
          </div>
        </div>
      )}

      {step === 'scheduled' && (
        <div className="text-center">
          <BlueMascot size={130} mood="excited" />
          <h3 className="mt-3 text-xl font-bold text-ink">All set! The meeting has been scheduled.</h3>
          <div className="mx-auto mt-3 max-w-sm rounded-2xl border border-slate-100 p-4 text-left text-sm">
            <p className="font-semibold text-ink">Discussion: {task.title}</p>
            <p className="text-muted">{slot.label} · with {helper.name}</p>
            <p className="mt-1 text-xs text-muted">Meet link: meet.google.com/demo-only (not a real room)</p>
          </div>
          <p className="mt-3 text-sm text-muted">You'll get a calendar invite shortly, and I'll be here when the meeting starts. Good luck!</p>
          <button onClick={() => setStep('calendar')} className={`${btnPrimary} mt-4`}>See it in my calendar</button>
        </div>
      )}

      {step === 'calendar' && (
        <div>
          <h3 className="text-lg font-bold text-ink">Step 6 · In your calendar</h3>
          <div className="mt-3 rounded-2xl border border-slate-100 p-3">
            {['10:00', '11:00', '12:00'].map((h) => (
              <div key={h} className="flex min-h-[44px] items-center gap-3 border-b border-slate-100 py-1 text-sm last:border-0">
                <span className="w-12 text-xs text-muted">{h}</span>
                {h === '11:00' && <span className="flex-1 rounded-lg bg-blue-500 px-3 py-2 text-white">{task.title} · {helper.name.split(' ')[0]}</span>}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted"><BlueMascot size={44} mood="wink" /> Ready for the meeting? I'm here if you need anything else!</span>
            <button onClick={() => { nav('/calendar'); closeDialog(); }} className={btnPrimary}>Open calendar</button>
          </div>
        </div>
      )}

      {step === 'busy' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-ink">{helper.name.split(' ')[0]} is busy right now. Here are your options.</h3>
          <section className="rounded-2xl border border-slate-100 p-4 text-sm">
            <p className="font-semibold text-ink">1 · Their next available slot</p>
            <p className="text-muted">{nextSlot(now(), 10, 45, 1).label}</p>
            <button onClick={() => { setSlot(nextSlot(now(), 10, 45, 1)); setStep('proposal'); }} className="mt-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100">Use this slot</button>
          </section>
          <section className="rounded-2xl border border-slate-100 p-4 text-sm">
            <p className="font-semibold text-ink">2 · Others who might help</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {others.map((m) => {
                const b = isBusy(m.id, day);
                return (
                  <li key={m.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span><span className="font-medium text-ink">{m.name}</span><span className={`ml-2 text-xs font-semibold ${b ? 'text-rose-500' : 'text-emerald-600'}`}>{b ? 'Busy' : 'Free'}</span></span>
                    {!b && <button onClick={() => { setHelper(m); setStep('compose'); }} className="text-xs font-semibold text-blue-600 hover:underline">Ask</button>}
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="rounded-2xl border border-slate-100 p-4 text-sm">
            <p className="font-semibold text-ink">3 · If time is critical</p>
            <p className="text-muted">You can send your work summary on Teams or Slack to your manager for a quick review. I'll draft it and ask your permission first.</p>
            {!managerNote ? (
              <button onClick={draftManager} disabled={busy} className="mt-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100">{busy ? 'Drafting…' : `Draft a note to ${manager.name.split(' ')[0]}`}</button>
            ) : (
              <div className="mt-2 space-y-2">
                <textarea value={managerNote} onChange={(e) => setManagerNote(e.target.value)} rows={5} className="w-full rounded-xl border border-slate-200 p-3 text-sm" aria-label="Note to your manager" />
                {!sentToManager ? (
                  <button onClick={() => send(manager, managerNote, () => setSentToManager(true))} className={`${btnPrimary} inline-flex items-center gap-2`}><Send size={15} /> Review &amp; send</button>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {['Drafted by Blue', 'Approved by you', 'Sent (demo outbox)', 'Waiting for a reply'].map((s, i) => <li key={s} className="flex items-center gap-2"><CheckCircle2 size={15} className={i < 3 ? 'text-good' : 'text-slate-300'} /> {s}</li>)}
                  </ul>
                )}
              </div>
            )}
            {error && <div role="alert" className="mt-2 text-sm text-rose-500">{error}<div>{enableWriting}</div></div>}
          </section>
        </div>
      )}
    </Modal>
  );
}
