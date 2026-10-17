import { useEffect, useState } from 'react';
import { Mail, Calendar as CalIcon, Search, RefreshCw, LogOut, Lock, Loader2, Video, ExternalLink, Check, Copy as CopyIcon } from 'lucide-react';
import { useGoogle, connectGoogle, disconnectGoogle, refreshGoogle, fetchMail, isConnected, preloadGoogle, getLocalClientId, setLocalClientId, getServerClientId, CLIENT_ID_RE, type MailItem } from '../core/connectors/google';
import { useBlueStore } from '../store';
import { useUi } from '../ui';
import { Card, CardHeader, EmptyState } from '../components/ui';

const when = (s: string) => {
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
};

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/calendar.readonly'];

function Copy({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard?.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}
      className="ml-1 inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-blue-600 ring-1 ring-slate-200 hover:bg-blue-50">
      {ok ? <Check size={11} /> : <CopyIcon size={11} />}{ok ? 'Copied' : 'Copy'}
    </button>
  );
}

/** Client ID input + OAuth setup steps + live connection progress. Used on Inbox and Apps. */
export function GoogleConnectPanel({ compact = false }: { compact?: boolean }) {
  const progress = useGoogle((s) => s.progress);
  const showToast = useBlueStore((s) => s.showToast);
  const [clientId, setClientId] = useState(getLocalClientId());
  const [serverId, setServerId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(!compact);
  const origin = window.location.origin;

  useEffect(() => { preloadGoogle(); getServerClientId().then(setServerId); }, []);

  const valid = CLIENT_ID_RE.test(clientId.trim());
  const usable = valid || (!clientId.trim() && Boolean(serverId));

  const go = async () => {
    setErr(null);
    setLocalClientId(clientId);
    setBusy(true);
    try { await connectGoogle(); showToast('Google connected (read-only)'); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Could not connect Google.'); }
    finally { setBusy(false); }
  };

  return (
    <div className={`grid gap-4 text-left ${compact ? '' : 'md:grid-cols-[1fr_1.1fr]'}`}>
      <div>
        <label htmlFor="gcid" className="block text-xs font-semibold text-ink">OAuth Client ID</label>
        <input id="gcid" value={clientId} onChange={(e) => setClientId(e.target.value)} spellCheck={false}
          placeholder={serverId ? 'Optional: the default client is configured' : '1234567890-abc123.apps.googleusercontent.com'}
          className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 font-mono text-xs focus:border-blue-500 ${clientId && !valid ? 'border-amber-400' : 'border-slate-200'}`} />
        {clientId && !valid && <p className="mt-1 text-[11px] text-amber-700">It should end in <code>.apps.googleusercontent.com</code>.</p>}
        <p className="mt-1 text-[11px] text-muted">Saved in this browser only. A client ID is a public identifier, not a secret.</p>
        <button onClick={go} disabled={busy || !usable} className="btn-primary mt-3 inline-flex w-full items-center justify-center gap-2 disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Connect Gmail + Calendar (read-only)
        </button>
        {(busy || progress) && (
          <p role="status" className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
            <Loader2 size={13} className="animate-spin" /> {progress ?? 'Starting…'}
          </p>
        )}
        {err && <p role="alert" className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{err}</p>}
        {compact && <button onClick={() => setShowSteps(!showSteps)} className="mt-2 text-[11px] font-semibold text-blue-600 hover:underline">{showSteps ? 'Hide' : 'Show'} setup steps</button>}
      </div>

      {showSteps && (
        <ol className="list-decimal space-y-2 rounded-2xl bg-slate-50 p-4 pl-8 text-xs text-ink">
          <li>Open <a className="font-semibold text-blue-600 underline" href="https://console.cloud.google.com/auth/overview" target="_blank" rel="noreferrer">Google Auth Platform</a> in any Google Cloud project and click <b>Get started</b>. Choose audience <b>External</b>.</li>
          <li>Enable the <a className="font-semibold text-blue-600 underline" href="https://console.cloud.google.com/apis/library/gmail.googleapis.com" target="_blank" rel="noreferrer">Gmail API</a> and the <a className="font-semibold text-blue-600 underline" href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com" target="_blank" rel="noreferrer">Google Calendar API</a>.</li>
          <li>Under <b>Audience → Test users</b>, add the Gmail address you will sign in with.</li>
          <li>Under <b>Data access → Add scopes</b>, add:
            {SCOPES.map((sc) => <span key={sc} className="mt-1 flex flex-wrap items-center"><code className="break-all">{sc}</code><Copy text={sc} /></span>)}
          </li>
          <li>Under <b>Clients → Create client</b>, pick <b>Web application</b>. In <b>Authorized JavaScript origins</b>, add:
            <span className="mt-1 flex flex-wrap items-center"><code className="break-all">{origin}</code><Copy text={origin} /></span>
            No redirect URI is needed.</li>
          <li>Copy the <b>Client ID</b>, paste it here, and click Connect. New clients can take a few minutes to start working.</li>
        </ol>
      )}
    </div>
  );
}

export default function Inbox() {
  const { email, mail, events, loading, error, token, progress } = useGoogle();
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
      <div className="mx-auto max-w-5xl p-4 sm:p-8">
        <h1 className="text-2xl font-bold text-ink">Inbox</h1>
        <p className="mb-5 text-sm text-muted">Your real Gmail and Google Calendar, read-only.</p>
        <Card className="p-6">
          <div className="mb-5 flex items-start gap-3"><Mail className="flex-shrink-0 text-rose-500" size={28} /><div>
          <p className="font-semibold text-ink">Connect Gmail and Calendar</p>
          <p className="mt-1 text-sm text-muted">Blue asks Google for read-only access. It shows the sender, subject and preview text of recent emails, and your upcoming events. The access token stays in this tab's memory only, so closing the tab disconnects.</p></div></div>
          {allowConnectors
            ? <GoogleConnectPanel />
            : <p className="text-sm text-amber-700">Connectors are off. <button onClick={() => openSettings('privacy')} className="font-semibold underline">Turn on "Allow connectors"</button> first.</p>}
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
      {progress && <p role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm text-blue-700"><Loader2 size={14} className="animate-spin" /> {progress}</p>}
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
