import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Settings, ListChecks, Users, Pause, Play, ShieldCheck } from 'lucide-react';
import BlueMascot from './BlueMascot';
import { useUi } from '../ui';
import { useBlueStore } from '../store';

const DOT: Record<string, string> = { active: 'bg-good', preroll: 'bg-warn', sleeping: 'bg-slate-400', paused: 'bg-slate-400' };

export default function Bubble() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { presence, roundupOffered, openSettings, openDialog } = useUi();
  const paused = useBlueStore((s) => s.settings.paused);
  const update = useBlueStore((s) => s.updateSettings);
  const resting = presence === 'sleeping' || presence === 'paused';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (path: string) => { nav(path); setOpen(false); };

  return (
    <div
      ref={ref}
      className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {open && (
        <div role="region" aria-label="Blue quick menu" className="absolute bottom-16 right-0 w-72 rounded-3xl border border-slate-100 bg-white p-4 shadow-2xl animate-pop">
          <div className="flex items-center gap-3">
            <BlueMascot size={64} mood={resting ? 'sleep' : 'wink'} />
            <div>
              <p className="font-semibold text-ink">Hey! I'm Blue</p>
              <p className="text-xs text-muted">{resting ? (paused ? 'Paused. I am not reading anything.' : 'Resting outside your work hours.') : 'How can I help you today?'}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {roundupOffered && !resting && (
              <button onClick={() => { openDialog('roundup'); setOpen(false); }} className="rounded-full bg-blue-500 px-4 py-2 text-left text-sm font-semibold text-white hover:bg-blue-600">Here's your roundup</button>
            )}
            <button onClick={() => go('/tasks')} className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-100"><ListChecks size={15} /> Show my tasks</button>
            <button onClick={() => go('/')} className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-100"><Users size={15} /> Check team updates</button>
            <button onClick={() => go('/chat')} className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-100"><MessageCircle size={15} /> Ask something</button>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <button onClick={() => update({ paused: !paused })} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-muted hover:bg-slate-100">
              {paused ? <Play size={13} /> : <Pause size={13} />} {paused ? 'Resume Blue' : 'Pause Blue'}
            </button>
            <span className="flex gap-1">
              <button onClick={() => { openSettings('privacy'); setOpen(false); }} aria-label="Privacy panel" title="Privacy panel" className="rounded-lg p-1.5 text-muted hover:bg-slate-100"><ShieldCheck size={15} /></button>
              <button onClick={() => { openSettings(); setOpen(false); }} aria-label="Open settings" title="Settings" className="rounded-lg p-1.5 text-muted hover:bg-slate-100"><Settings size={15} /></button>
            </span>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        onFocus={() => setOpen(true)}
        aria-expanded={open}
        aria-label={open ? 'Close Blue menu' : 'Open Blue menu'}
        className="relative flex h-16 w-16 items-center justify-center rounded-full bg-navy-900 shadow-xl ring-2 ring-white/70 transition hover:scale-105"
      >
        <BlueMascot size={46} mood={resting ? 'sleep' : 'happy'} />
        <span aria-hidden="true" className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-navy-900 ${DOT[presence]}`} />
        {roundupOffered && !resting && <span aria-hidden="true" className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-rose-500 ring-2 ring-white" />}
        <span className="sr-only">Status: {presence}</span>
      </button>
    </div>
  );
}
