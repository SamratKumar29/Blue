import { useState } from 'react';
import { Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBlueStore } from '../../store';
import { useUi } from '../../ui';
import Modal, { btnGhost, btnPrimary } from '../Modal';
import { guard } from '../../core/policy/useGate';
import { hashAction } from '../../core/policy/gate';
import { TEAM } from '../../core/features/askSenior';
import { draftMessage, summarizeText } from '../../core/features/draft';
import { capacityOptions } from '../../core/features/capacity';
import { fetchApproved } from '../../core/connectors/demoWorkspace';
import { friendlyAiError } from '../../core/ai/run';
import type { Effort, TaskGroup } from '../../core/types';
import type { CapacityOut } from '../../core/ai/schemas';

const field = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500';

function useSendGuard() {
  const addOutbox = useBlueStore((s) => s.addOutbox);
  const updateSettings = useBlueStore((s) => s.updateSettings);
  const [error, setError] = useState<string | null>(null);
  const [writeOff, setWriteOff] = useState(false);
  const [sent, setSent] = useState(false);
  const send = async (recipient: string, content: string) => {
    setError(null); setWriteOff(false);
    const r = await guard({ type: 'send_message', recipient, content, effect: 'Send message' }, async (final) => {
      await addOutbox({ recipient: final.recipient!, content: final.content!, approvedHash: await hashAction(final), kind: 'message' });
    }, { editable: true });
    if (r.ok) setSent(true);
    else if (!r.cancelled) { setError(r.reason); setWriteOff(r.reason === 'Write actions are off.'); }
  };
  const turnOn = async () => { await updateSettings({ allowWriting: true }); setWriteOff(false); setError(null); };
  return { send, error, writeOff, sent, turnOn };
}

const ErrorLine = ({ error, writeOff, turnOn }: { error: string | null; writeOff: boolean; turnOn: () => void }) =>
  error ? (
    <div role="alert" className="text-sm text-rose-500">{error}
      {writeOff && <div><button onClick={turnOn} className="mt-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100">Turn on writing (I will still ask every time)</button></div>}
    </div>
  ) : null;

export function SummarizeDialog() {
  const close = useUi((s) => s.closeDialog);
  const connectors = useBlueStore((s) => s.settings.allowConnectors);
  const [text, setText] = useState('');
  const [bullets, setBullets] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (t: string) => {
    setBusy(true); setError(null); setBullets(null);
    try { setBullets(await summarizeText(t)); } catch (e) { setError(friendlyAiError(e)); } finally { setBusy(false); }
  };
  const fromWorkspace = async () => {
    const a = await fetchApproved();
    const email = a.emails[0];
    if (!email) { setError(a.denied[0] ?? 'No source is switched on.'); return; }
    setText(`${email.subject}\n${email.body}`);
  };

  return (
    <Modal title="Summarize" subtitle="Paste text or pick an approved source" mood="thinking" onClose={close}
      footer={<><button onClick={close} className={btnGhost}>Close</button><button disabled={busy || !text.trim()} onClick={() => run(text)} className={btnPrimary}>{busy ? 'Summarizing…' : 'Summarize'}</button></>}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} aria-label="Text to summarize" placeholder="Paste something to summarize. Code and secrets are filtered out." className={field} />
      <div className="mt-2"><button onClick={fromWorkspace} disabled={!connectors} className="text-xs font-semibold text-blue-600 hover:underline disabled:text-muted disabled:no-underline">{connectors ? 'Use a message from the Demo Workspace' : 'Turn on the Demo Workspace to pick a source'}</button></div>
      {error && <p role="alert" className="mt-3 text-sm text-rose-500">{error}</p>}
      {bullets && <ul className="mt-4 space-y-2">{bullets.map((b, i) => <li key={i} className="rounded-xl bg-blue-50 px-4 py-2 text-sm text-ink">• {b}</li>)}</ul>}
      <p className="mt-4 text-xs text-muted">Nothing here is saved.</p>
    </Modal>
  );
}

export function WriteDialog() {
  const close = useUi((s) => s.closeDialog);
  const name = useBlueStore((s) => s.settings.name);
  const [intent, setIntent] = useState('');
  const [to, setTo] = useState(TEAM[0].name);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const g = useSendGuard();

  const make = async () => {
    setBusy(true); setError(null);
    try { setDraft(await draftMessage(intent, to)); } catch (e) { setError(friendlyAiError(e)); } finally { setBusy(false); }
  };

  return (
    <Modal title="Write" subtitle={`Tell me what you want to say, ${name.split(' ')[0]}`} mood="working" onClose={close} wide>
      {g.sent ? (
        <div className="py-6 text-center"><p className="text-lg font-semibold text-ink">Saved to your demo Outbox.</p><p className="mt-1 text-sm text-muted">Demo: nothing is actually sent.</p><button onClick={close} className={`${btnPrimary} mt-4`}>Done</button></div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink">To</span>
            <select value={to} onChange={(e) => setTo(e.target.value)} className={field}>{TEAM.map((m) => <option key={m.id}>{m.name}</option>)}</select></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink">What do you want to say?</span>
            <textarea value={intent} onChange={(e) => setIntent(e.target.value)} rows={3} placeholder="e.g. Ask if we can move the design review to Thursday" className={field} /></label>
          <button onClick={make} disabled={busy || !intent.trim()} className={btnPrimary}>{busy ? 'Drafting…' : draft ? 'Redraft' : 'Draft it'}</button>
          {draft && <label className="block text-sm"><span className="mb-1 block font-medium text-ink">Draft (editable)</span><textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={8} className={field} /></label>}
          {error && <p role="alert" className="text-sm text-rose-500">{error}</p>}
          <ErrorLine error={g.error} writeOff={g.writeOff} turnOn={g.turnOn} />
          {draft && <div className="flex justify-end"><button onClick={() => g.send(to, draft)} className={`${btnPrimary} inline-flex items-center gap-2`}><Send size={15} /> Review &amp; send</button></div>}
        </div>
      )}
    </Modal>
  );
}

export function CreateTaskDialog() {
  const close = useUi((s) => s.closeDialog);
  const addTask = useBlueStore((s) => s.addTask);
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('Atlas');
  const [minutes, setMinutes] = useState(30);
  const [group, setGroup] = useState<TaskGroup>('next_up');

  const save = async () => {
    const effort: Effort = minutes < 30 ? 'easy' : minutes < 90 ? 'medium' : 'deep';
    await addTask({
      title: title.trim(), project: project.trim() || 'General', estimateMin: Math.max(5, Math.min(480, minutes)), effort, group,
      urgency: 'med', status: 'todo',
      explanation: { sourceCategory: 'manual', confidence: 1, reason: 'You added this task yourself.' },
      provenance: { source: 'manual', ref: 'user' },
    });
    close();
  };

  return (
    <Modal title="Create task" subtitle="Add something to your day" onClose={close}
      footer={<><button onClick={close} className={btnGhost}>Cancel</button><button onClick={save} disabled={!title.trim()} className={btnPrimary}>Add task</button></>}>
      <div className="space-y-3">
        <label className="block text-sm"><span className="mb-1 block font-medium text-ink">Title</span><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && title.trim() && save()} className={field} /></label>
        <div className="grid grid-cols-3 gap-3">
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink">Project</span><input value={project} onChange={(e) => setProject(e.target.value)} className={field} /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink">Minutes</span><input type="number" min={5} max={480} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={field} /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink">Group</span>
            <select value={group} onChange={(e) => setGroup(e.target.value as TaskGroup)} className={field}><option value="easy_wins">Easy wins</option><option value="next_up">Next up</option><option value="needs_senior">Needs senior help</option></select></label>
        </div>
      </div>
    </Modal>
  );
}

export function MoreMenuDialog() {
  const { closeDialog, openDialog, openSettings } = useUi();
  const nav = useNavigate();
  const { settings, updateSettings } = useBlueStore();
  const items: [string, () => void][] = [
    ['Wellbeing check-in (private, skippable)', () => openDialog('checkin')],
    ["Today's roundup", () => openDialog('roundup')],
    ['A teammate said no (capacity options)', () => openDialog('capacity')],
    ['Privacy panel and audit log', () => { closeDialog(); openSettings('privacy'); }],
    ['Open the Outbox', () => { closeDialog(); nav('/outbox'); }],
    [settings.paused ? 'Resume Blue' : 'Pause Blue', () => { updateSettings({ paused: !settings.paused }); closeDialog(); }],
  ];
  return (
    <Modal title="More" subtitle="Everything else Blue can do" onClose={closeDialog}>
      <ul className="space-y-2">{items.map(([label, fn]) => <li key={label}><button onClick={fn} className="w-full rounded-xl border border-slate-100 px-4 py-3 text-left text-sm font-medium text-ink hover:bg-blue-50">{label}</button></li>)}</ul>
    </Modal>
  );
}

export function CapacityDialog({ taskId, person }: { taskId?: string; person?: string }) {
  const close = useUi((s) => s.closeDialog);
  const tasks = useBlueStore((s) => s.tasks).filter((t) => t.status === 'todo');
  const [tid, setTid] = useState(taskId ?? tasks[0]?.id);
  const [who, setWho] = useState(person ?? TEAM[4]?.name ?? TEAM[0].name);
  const [out, setOut] = useState<CapacityOut | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const g = useSendGuard();

  const go = async () => {
    const t = tasks.find((x) => x.id === tid);
    if (!t) return;
    setBusy(true); setError(null);
    try { const r = await capacityOptions(t, who); setOut(r); setReply(r.replyDraft); } catch (e) { setError(friendlyAiError(e)); } finally { setBusy(false); }
  };

  return (
    <Modal title="A teammate said no" subtitle="That is capacity information, not a verdict" mood="encouraging" onClose={close} wide>
      {g.sent ? (
        <div className="py-6 text-center"><p className="text-lg font-semibold text-ink">Reply saved to your demo Outbox.</p><button onClick={close} className={`${btnPrimary} mt-4`}>Done</button></div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm"><span className="mb-1 block font-medium text-ink">Task</span><select value={tid} onChange={(e) => setTid(e.target.value)} className={field}>{tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
            <label className="text-sm"><span className="mb-1 block font-medium text-ink">Who said they are at capacity?</span><select value={who} onChange={(e) => setWho(e.target.value)} className={field}>{TEAM.map((m) => <option key={m.id}>{m.name}</option>)}</select></label>
          </div>
          <button onClick={go} disabled={busy || !tid} className={btnPrimary}>{busy ? 'Thinking…' : 'Show me options'}</button>
          {error && <p role="alert" className="text-sm text-rose-500">{error}</p>}
          {out && (
            <>
              <ul className="space-y-2">{out.options.map((o, i) => <li key={i} className="rounded-xl border border-slate-100 p-3 text-sm"><span className="mr-2 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">{o.kind.replace('_', ' ')}</span>{o.text}</li>)}</ul>
              <label className="block text-sm"><span className="mb-1 block font-medium text-ink">A respectful reply (editable)</span><textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} className={field} /></label>
              <ErrorLine error={g.error} writeOff={g.writeOff} turnOn={g.turnOn} />
              <div className="flex justify-end"><button onClick={() => g.send(who, reply)} className={`${btnPrimary} inline-flex items-center gap-2`}><Send size={15} /> Review &amp; send</button></div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
