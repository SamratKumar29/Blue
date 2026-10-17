import { create } from 'zustand';
import { guard } from '../policy/useGate';
import { redactSecrets, isCodebaseContent } from './filters';

// Real, read-only Google Workspace connector (Gmail + Calendar).
// The OAuth access token lives only in memory for this tab: it is never written to storage,
// and closing or refreshing the tab disconnects. Only headers and snippets are fetched, never full bodies.

export const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
export const CAL_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const GIS_SRC = 'https://accounts.google.com/gsi/client';

export interface MailItem { id: string; from: string; subject: string; date: string; snippet: string; unread: boolean }
export interface CalEvent { id: string; title: string; start: string; end: string; allDay: boolean; link?: string; meet?: string }

interface TokenResponse { access_token?: string; expires_in?: number; scope?: string; error?: string; error_description?: string }
interface TokenClient { requestAccessToken(o?: { prompt?: string }): void }
interface GisWindow { google?: { accounts: { oauth2: {
  initTokenClient(c: { client_id: string; scope: string; callback: (r: TokenResponse) => void; error_callback?: (e: { type?: string; message?: string }) => void }): TokenClient;
  revoke(token: string, cb?: () => void): void;
} } } }

interface GoogleState {
  token: string | null;
  expiresAt: number;
  email: string | null;
  scopes: string[];
  mail: MailItem[];
  events: CalEvent[];
  loading: boolean;
  error: string | null;
}

export const useGoogle = create<GoogleState>(() => ({
  token: null, expiresAt: 0, email: null, scopes: [], mail: [], events: [], loading: false, error: null,
}));

export const hasGmail = () => isConnected() && useGoogle.getState().scopes.includes(GMAIL_SCOPE);
export const hasCalendar = () => isConnected() && useGoogle.getState().scopes.includes(CAL_SCOPE);
export function isConnected() {
  const s = useGoogle.getState();
  return Boolean(s.token) && Date.now() < s.expiresAt;
}

let clientIdPromise: Promise<string | null> | null = null;
export function getClientId(): Promise<string | null> {
  clientIdPromise ??= fetch('/api/config')
    .then((r) => (r.ok ? r.json() : null))
    .then((c: { googleClientId?: string | null } | null) => c?.googleClientId || null)
    .catch(() => null);
  return clientIdPromise;
}

let gisPromise: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if ((window as GisWindow).google?.accounts?.oauth2) return Promise.resolve();
  gisPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GIS_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { gisPromise = null; reject(new Error('Could not load Google sign-in.')); };
    document.head.appendChild(s);
  });
  return gisPromise;
}

/** Opens Google's consent popup for read-only Gmail and Calendar access. */
export async function connectGoogle(): Promise<void> {
  const gate = await guard({ type: 'read_source', source: 'google-workspace', effect: 'Read Gmail and Calendar (read-only)' }, () => true);
  if (!gate.ok) throw new Error(gate.reason);
  const clientId = await getClientId();
  if (!clientId) throw new Error('Google sign-in is not configured on the server yet.');
  await loadGis();
  const oauth2 = (window as GisWindow).google!.accounts.oauth2;
  const resp = await new Promise<TokenResponse>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: `${GMAIL_SCOPE} ${CAL_SCOPE} openid email`,
      callback: resolve,
      error_callback: (e) => reject(new Error(e.type === 'popup_closed' ? 'Sign-in was cancelled.' : e.message || 'Google sign-in failed.')),
    });
    client.requestAccessToken({ prompt: 'consent' });
  });
  if (!resp.access_token) throw new Error(resp.error_description || 'Google did not grant access.');
  useGoogle.setState({
    token: resp.access_token,
    expiresAt: Date.now() + (resp.expires_in ?? 3600) * 1000 - 60_000,
    scopes: (resp.scope ?? '').split(' '),
    error: null,
  });
  const me = await api<{ email?: string }>('https://www.googleapis.com/oauth2/v3/userinfo').catch(() => ({ email: undefined }));
  useGoogle.setState({ email: me.email ?? null });
  await refreshGoogle();
}

export function disconnectGoogle() {
  const { token } = useGoogle.getState();
  if (token) (window as GisWindow).google?.accounts.oauth2.revoke(token);
  useGoogle.setState({ token: null, expiresAt: 0, email: null, scopes: [], mail: [], events: [], error: null });
}

async function api<T>(url: string): Promise<T> {
  const { token } = useGoogle.getState();
  if (!token || !isConnected()) throw new Error('Google session expired. Connect again.');
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 401) { disconnectGoogle(); throw new Error('Google session expired. Connect again.'); }
  if (!r.ok) throw new Error(`Google API error (${r.status}).`);
  return (await r.json()) as T;
}

const clean = (s: string) => (isCodebaseContent(s) ? '[hidden: looks like code]' : redactSecrets(s));

/** Lists mail matching a Gmail search query (default: last 48 hours). Metadata + snippet only. */
export async function fetchMail(query = 'newer_than:2d', max = 25): Promise<MailItem[]> {
  if (!hasGmail()) return [];
  const list = await api<{ messages?: { id: string }[] }>(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${max}&q=${encodeURIComponent(query)}`,
  );
  const ids = (list.messages ?? []).map((m) => m.id);
  const items = await Promise.all(ids.map(async (id) => {
    const m = await api<{ id: string; snippet?: string; labelIds?: string[]; payload?: { headers?: { name: string; value: string }[] } }>(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
    );
    const h = (n: string) => m.payload?.headers?.find((x) => x.name.toLowerCase() === n.toLowerCase())?.value ?? '';
    return {
      id: m.id,
      from: h('From').replace(/<[^>]+>/, '').replace(/"/g, '').trim() || h('From'),
      subject: clean(h('Subject') || '(no subject)'),
      date: h('Date'),
      snippet: clean(decodeEntities(m.snippet ?? '')),
      unread: (m.labelIds ?? []).includes('UNREAD'),
    } satisfies MailItem;
  }));
  return items;
}

/** Calendar events from yesterday to 14 days ahead on the primary calendar. */
export async function fetchEvents(): Promise<CalEvent[]> {
  if (!hasCalendar()) return [];
  const min = new Date(Date.now() - 86_400_000).toISOString();
  const max = new Date(Date.now() + 14 * 86_400_000).toISOString();
  const r = await api<{ items?: { id: string; summary?: string; htmlLink?: string; hangoutLink?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }[] }>(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=50&timeMin=${encodeURIComponent(min)}&timeMax=${encodeURIComponent(max)}`,
  );
  return (r.items ?? []).map((e) => ({
    id: e.id,
    title: clean(e.summary || '(no title)'),
    start: e.start?.dateTime ?? e.start?.date ?? '',
    end: e.end?.dateTime ?? e.end?.date ?? '',
    allDay: !e.start?.dateTime,
    link: e.htmlLink,
    meet: e.hangoutLink,
  }));
}

export async function refreshGoogle(): Promise<void> {
  useGoogle.setState({ loading: true, error: null });
  try {
    const [mail, events] = await Promise.all([fetchMail(), fetchEvents()]);
    useGoogle.setState({ mail, events, loading: false });
  } catch (e) {
    useGoogle.setState({ loading: false, error: e instanceof Error ? e.message : 'Could not load Google data.' });
  }
}

function decodeEntities(s: string) {
  return s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
