import { useState } from 'react';
import { Mail, Calendar as CalIcon, Search, RefreshCw, LogOut, Lock, Loader2, Video, ExternalLink } from 'lucide-react';
import { useGoogle, connectGoogle, disconnectGoogle, refreshGoogle, fetchMail, isConnected, type MailItem } from '../core/connectors/google';
import { useBlueStore } from '../store';
import { useUi } from '../ui';
import { Card, CardHeader, EmptyState } from '../components/ui';

const when = (s: string) => {
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
};

export function GoogleConnectButton({ className = '' }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  const showToast = useBlueStore((s) => s.showToast);
  const go = async () => {
    setBusy(true);
    try { await connectGoogle(); showToast('Google connected (read-only)'); }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not connect Google.'); }
    finally { setBusy(false); }
  };
  return (
    <button onClick={go} disabled={busy} className={`btn-primary inline-flex items-center gap-2 disabled:opacity-50 ${className}`}>
      {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Sign in with Google (read-only)
    </button>
  );
}

export default function Inbox() {
  const { email, mail, events, loading, error, token } = useGoogle();
  const allowConnectors = useBlueStore((s) => s.settings.allowConnectors);
  const openSettings = useUi((s) => s.openSettings);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<MailItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const connected = Boolean(token) && isConnected();

  const search = async () => {
    if (!q.trim()) { setResults(null); return; }
    setSearching(true); setSearchErr(null);
    try { setResults(await fetchMail(q.trim(), 25)); }
    catch (e) { setSearchErr(e instanceof Error ? e.message : 'Search failed.'); }
    finally { setSearching(false); }
  };

  if (!connected) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-8">
        <h1 className="text-2xl font-bold text-ink">Inbox</h1>
        <p className="mb-5 text-sm text-muted">Your real Gmail and Google Calendar, read-only.</p>
        <Card className="p-6 text-center">
          <Mail className="mx-auto text-rose-500" size={32} />
          <p className="mt-3 font-semibold text-ink">Connect Gmail and Calendar</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">Blue asks Google for read-only access. It shows the sender, subject and preview text of recent emails, and your upcoming events. The access token stays in this tab's memory only, so closing the tab disconnects.</p>
          {allowConnectors
            ? <GoogleConnectButton className="mt-5" />
            : <p className="mt-5 text-sm text-amber-700">Connectors are off. <button onClick={() => openSettings('privacy')} className="font-semibold underline">Turn on "Allow connectors"</button> first.</p>}
        </Card>
      </div>
    );
  }

  const list = results ?? mail;
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Inbox</h1>
          <p className="text-sm text-muted">Signed in as <strong className="text-ink">{email ?? 'Google account'}</strong> · read-only</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refreshGoogle()} aria-label="Refresh" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ink shadow-card hover:bg-blue-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>
          <button onClick={disconnectGoogle} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-50"><LogOut size={15} /> Disconnect</button>
        </div>
      </div>
      {error && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card className="p-5">
          <CardHeader icon={<Mail size={16} />} title={results ? `Search results (${results.length})` : 'Last 48 hours'} />
          <form onSubmit={(e) => { e.preventDefault(); search(); }} className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search mail" placeholder='Search all mail, e.g. from:priya invoice' className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500" />
            </div>
            <button type="submit" disabled={searching} className="btn-primary disabled:opacity-50">{searching ? 'Searching…' : 'Search'}</button>
            {results && <button type="button" onClick={() => { setResults(null); setQ(''); }} className="text-sm font-semibold text-muted hover:underline">Clear</button>}
          </form>
          {searchErr && <p className="mb-2 text-sm text-amber-700">{searchErr}</p>}
          {loading && !results ? <p className="text-sm text-muted">Loading…</p>
            : list.length === 0 ? <EmptyState title={results ? 'No matching emails' : 'No emails in the last 48 hours'} />
            : (
              <ul className="divide-y divide-slate-100">
                {list.map((m) => (
                  <li key={m.id} className="py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className={`truncate text-sm ${m.unread ? 'font-bold text-ink' : 'font-medium text-ink'}`}>{m.from}</p>
                      <span className="flex-shrink-0 text-[11px] text-muted">{when(m.date)}</span>
                    </div>
                    <p className={`truncate text-sm ${m.unread ? 'font-semibold text-ink' : 'text-ink'}`}>{m.subject}</p>
                    <p className="line-clamp-2 text-xs text-muted">{m.snippet}</p>
                  </li>
                ))}
              </ul>
            )}
        </Card>

        <Card className="p-5">
          <CardHeader icon={<CalIcon size={16} />} title="Upcoming events" />
          {events.length === 0 ? <EmptyState title="No events in the next 14 days" /> : (
            <ul className="space-y-3">
              {events.map((e) => (
                <li key={e.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-ink">{e.title}</p>
                  <p className="text-xs text-muted">{e.allDay ? new Date(e.start).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) + ' · all day' : `${when(e.start)} – ${new Date(e.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</p>
                  <div className="mt-1 flex gap-3">
                    {e.meet && <a href={e.meet} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"><Video size={12} /> Meet</a>}
                    {e.link && <a href={e.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"><ExternalLink size={12} /> Open</a>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted"><Lock size={12} /> Blue reads headers and preview text only, hides anything that looks like code or a secret, and never sends, deletes or changes mail.</p>
    </div>
  );
}
