import { useEffect, useState } from 'react';
import { fetchApproved } from './demoWorkspace';
import { useBlueStore } from '../../store';

export interface WorkspaceSummary {
  slack: { count: number; time: string } | null;
  gmail: { count: number; time: string } | null;
  calendar: { title: string; time: string } | null;
}

const t = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
let cache: WorkspaceSummary | null = null;
let inflight: Promise<WorkspaceSummary> | null = null;

async function load(): Promise<WorkspaceSummary> {
  const a = await fetchApproved();
  const important = a.emails.filter((e) => !/newsletter/i.test(e.from));
  const lastOf = <T extends { ts: string }>(xs: T[]) => xs.map((x) => x.ts).sort().reverse()[0] ?? '';
  const ev = [...a.events].sort((x, y) => x.start.localeCompare(y.start))[0];
  return {
    slack: a.messages.length ? { count: a.messages.length, time: t(lastOf(a.messages)) } : null,
    gmail: important.length ? { count: important.length, time: t(lastOf(important)) } : null,
    calendar: ev ? { title: `${ev.title} (${t(ev.start)})`, time: t(ev.start) } : null,
  };
}

/** One read per session (and per permission change) so the audit log stays meaningful. */
export function useWorkspaceSummary(): { data: WorkspaceSummary | null; loading: boolean } {
  const allow = useBlueStore((s) => s.settings.allowConnectors && !s.settings.paused);
  const sources = useBlueStore((s) => s.meta.sources);
  const key = JSON.stringify(sources);
  const [data, setData] = useState<WorkspaceSummary | null>(allow ? cache : null);
  const [loading, setLoading] = useState(allow && !cache);

  useEffect(() => {
    if (!allow) { cache = null; setData(null); setLoading(false); return; }
    if (cache) { setData(cache); return; }
    let alive = true;
    setLoading(true);
    inflight ??= load().finally(() => { inflight = null; });
    inflight.then((r) => { cache = r; if (alive) { setData(r); setLoading(false); } });
    return () => { alive = false; };
  }, [allow, key]);

  return { data, loading };
}
