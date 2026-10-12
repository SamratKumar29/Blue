import calendar from '../data/calendar.json';
import { Calendar as CalIcon, Users } from 'lucide-react';
import { useBlueStore } from '../store';
import { Card, EmptyState } from '../components/ui';

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function Calendar() {
  const allow = useBlueStore((s) => s.settings.allowConnectors && s.meta.sources['demo-calendar']);
  const outbox = useBlueStore((s) => s.outbox).filter((o) => o.kind === 'event' && o.when);
  const events = [
    ...(allow ? calendar.map((e) => ({ id: e.id, title: e.title, start: e.start, end: e.end, who: e.attendees.join(', '), scheduled: false })) : []),
    ...outbox.map((o) => ({ id: o.id, title: o.content.split('\n')[0].replace('Meeting: ', ''), start: o.when!, end: o.when!, who: o.recipient, scheduled: true })),
  ].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-ink">Calendar</h1>
      <p className="mb-5 text-sm text-muted">Read-only demo events, plus meetings you approved through Blue.</p>
      {events.length === 0 ? (
        <Card><EmptyState title="Nothing here yet" hint="Connect the Demo Workspace in Settings, or schedule a meeting from Ask a senior." /></Card>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id}>
              <Card className={`flex items-center gap-4 p-4 ${e.scheduled ? 'ring-2 ring-blue-200' : ''}`}>
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500"><CalIcon size={20} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{e.title}{e.scheduled && <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white">Scheduled by Blue (demo)</span>}</p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted"><Users size={12} /> {e.who}</p>
                </div>
                <div className="text-right text-sm text-ink"><p>{new Date(e.start).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p><p className="text-xs text-muted">{time(e.start)}{e.end !== e.start ? ` – ${time(e.end)}` : ''}</p></div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
