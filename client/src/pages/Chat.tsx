import { useEffect, useRef, useState } from 'react';
import { Send, Lock, BookmarkPlus } from 'lucide-react';
import { useBlueStore } from '../store';
import BlueMascot from '../components/BlueMascot';
import { chatReply } from '../core/features/chat';
import { friendlyAiError } from '../core/ai/run';
import { docText } from '../core/features/retrieval';
import { useUi } from '../ui';

interface Msg { role: 'user' | 'blue'; text: string; sources?: string[]; error?: boolean }

export default function Chat() {
  // History lives in memory for this session only. "Save this note" stores a short summary.
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const addSummary = useBlueStore((s) => s.addSummary);
  const paused = useBlueStore((s) => s.settings.paused);
  const openSettings = useUi((s) => s.openSettings);
  const end = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState<number | null>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, busy]);

  const send = async (text = input) => {
    const t = text.trim();
    if (!t || busy) return;
    setInput('');
    setMsgs((m) => [...m, { role: 'user', text: t }]);
    setBusy(true);
    try {
      const a = await chatReply(t);
      setMsgs((m) => [...m, { role: 'blue', text: a.text, sources: a.sources }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: 'blue', text: friendlyAiError(e), error: true }]);
    } finally { setBusy(false); }
  };

  const save = async (i: number) => {
    const m = msgs[i];
    await addSummary({ kind: 'note', text: m.text.slice(0, 280), sources: [{ source: 'manual', ref: 'chat' }] });
    setSaved(i);
  };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col p-4 sm:p-8">
      <div className="mb-4 flex items-center gap-3"><BlueMascot size={64} mood={busy ? 'thinking' : 'happy'} /><div><h1 className="text-2xl font-bold text-ink">Ask Blue</h1><p className="flex items-center gap-1.5 text-xs text-muted"><Lock size={12} /> Blue is private. This conversation stays in this tab unless you save a note.</p></div></div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-3xl bg-white p-4 shadow-card" aria-live="polite" aria-label="Conversation">
        {msgs.length === 0 && (
          <div className="py-8 text-center text-sm text-muted">
            <p className="mb-3">Try one of these:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['What is our escalation policy?', 'What should I start with today?', 'Who should review a pull request?'].map((q) => (
                <button key={q} onClick={() => send(q)} className="rounded-full border border-slate-200 px-4 py-2 text-ink hover:bg-blue-50">{q}</button>
              ))}
            </div>
            {docText('incident-escalation') && <p className="mt-4 text-xs">Answers can cite your approved policy documents when team context is on.</p>}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-blue-500 text-white' : m.error ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-ink'}`}>
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.sources && m.sources.length > 0 && <p className="mt-2 flex flex-wrap gap-1.5">{m.sources.map((s) => <span key={s} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-blue-600">📄 {s}</span>)}</p>}
              {m.role === 'blue' && !m.error && <button onClick={() => save(i)} disabled={saved === i} className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-blue-600 disabled:text-good"><BookmarkPlus size={12} /> {saved === i ? 'Saved' : 'Save this note'}</button>}
            </div>
          </div>
        ))}
        {busy && <p className="text-sm text-muted">Blue is thinking…</p>}
        <div ref={end} />
      </div>

      {paused && <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700">Blue is paused. <button onClick={() => openSettings('privacy')} className="font-semibold underline">Resume in Settings</button></p>}
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-3 flex gap-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} aria-label="Message to Blue" placeholder="Ask Blue anything about your work…" className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-500" />
        <button type="submit" disabled={busy || !input.trim()} className="btn-primary inline-flex items-center gap-2 disabled:opacity-40"><Send size={16} /> Send</button>
      </form>
    </div>
  );
}
