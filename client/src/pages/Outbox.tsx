import { Send, CalendarPlus } from 'lucide-react';
import { useBlueStore } from '../store';
import { Card, EmptyState } from '../components/ui';

export default function Outbox() {
  const outbox = useBlueStore((s) => s.outbox);
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-ink">Outbox</h1>
      <p className="mb-5 rounded-xl bg-blue-50 px-4 py-2 text-sm text-blue-700">Demo outbox: nothing is actually sent. Each item below is exactly the text you approved.</p>
      {outbox.length === 0 ? (
        <Card><EmptyState title="Nothing here yet" hint="Approved messages and meetings will appear here. Blue never sends anything without your approval." /></Card>
      ) : (
        <ul className="space-y-3">
          {outbox.map((o) => (
            <li key={o.id}>
              <Card className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold text-ink">{o.kind === 'event' ? <CalendarPlus size={16} className="text-blue-500" /> : <Send size={16} className="text-blue-500" />} {o.kind === 'event' ? 'Meeting with' : 'To'} {o.recipient}</span>
                  <span className="text-xs text-muted">{new Date(o.at).toLocaleString()}</span>
                </div>
                <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 font-sans text-sm text-ink">{o.content}</pre>
                <p className="mt-2 text-[11px] text-muted">Approval hash {o.approvedHash.slice(0, 10)}…</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
