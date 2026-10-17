import { useState } from 'react';
import { clearDemoTime, isDemoClock, now, setDemoTime } from '../core/presence/demoClock';
import { formatClock } from '../core/presence/workHours';
import { useBlueStore } from '../store';
import { useUi } from '../ui';

/** Visible only with ?demo=1. Lets us show the sleep/wake behaviour in the demo video. */
export default function DemoClockPanel() {
  const tz = useBlueStore((s) => s.settings.timezone);
  const presence = useUi((s) => s.presence);
  const [, force] = useState(0);
  const enabled = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1';
  if (!enabled) return null;
  const set = (t: string) => { setDemoTime(t, tz); force((n) => n + 1); };
  return (
    <div role="region" aria-label="Demo clock" className="fixed bottom-24 left-24 z-[60] rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-ink">Demo clock · {formatClock(now(), tz)} · {presence}{isDemoClock() ? '' : ' (real)'}</p>
      <div className="flex flex-wrap gap-1.5">
        {['08:00', '09:05', '11:00', '19:00'].map((t) => <button key={t} onClick={() => set(t)} className="rounded-lg bg-blue-50 px-2 py-1 font-semibold text-blue-600 hover:bg-blue-100">{t}</button>)}
        <button onClick={() => { clearDemoTime(); force((n) => n + 1); }} className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-ink">Real time</button>
      </div>
    </div>
  );
}
