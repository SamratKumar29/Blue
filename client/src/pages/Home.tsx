import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, HelpCircle, Search, Sparkles, ListChecks, Users, MessageSquare, FileText, PenLine, LifeBuoy, PlusSquare, MoreHorizontal, Plus, ChevronRight, Mail, Calendar as CalIcon, Hash, Newspaper, ClipboardCheck, Clock, CalendarDays } from 'lucide-react';
import { useBlueStore } from '../store';
import { useUi } from '../ui';
import TaskRow from '../components/TaskRow';
import BlueMascot from '../components/BlueMascot';
import { Card, CardHeader, EmptyState, GROUP_ORDER, Skeleton, greeting } from '../components/ui';
import { useWorkspaceSummary } from '../core/connectors/useWorkspace';
import { now } from '../core/presence/demoClock';
import { TEAM } from '../core/features/askSenior';
import { retrieve } from '../core/features/retrieval';
import messages from '../data/messages.json';
import emails from '../data/emails.json';
import calendarEvents from '../data/calendar.json';

function useLiveClock(tz: string) {
  const [t, setT] = useState(now());
  useEffect(() => {
    const id = setInterval(() => setT(now()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = new Intl.DateTimeFormat([], { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(t);
  const date = new Intl.DateTimeFormat([], { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(t);
  return { time, date };
}

const STATUS = {
  on_track: ['On track', 'text-emerald-600'],
  in_progress: ['In progress', 'text-amber-600'],
  needs_help: ['Needs help', 'text-rose-500'],
  at_capacity: ['At capacity', 'text-rose-500'],
} as const;

function initials(n: string) { return n.split(' ').map((p) => p[0]).slice(0, 2).join(''); }

function SearchBox() {
  const [q, setQ] = useState('');
  const tasks = useBlueStore((s) => s.tasks);
  const nav = useNavigate();
  const openDialog = useUi((s) => s.openDialog);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return [
      ...tasks.filter((t) => t.title.toLowerCase().includes(s)).slice(0, 3).map((t) => ({ label: t.title, kind: 'Task', go: () => openDialog('analysis', { taskId: t.id }) })),
      ...TEAM.filter((m) => `${m.name} ${m.role} ${m.expertise.join(' ')}`.toLowerCase().includes(s)).slice(0, 3).map((m) => ({ label: `${m.name} · ${m.role}`, kind: 'Team', go: () => nav('/team') })),
      ...retrieve(s, 2).map((h) => ({ label: h.doc.replace(/[-_]/g, ' '), kind: 'Doc', go: () => nav('/files') })),
    ];
  }, [q, tasks, nav, openDialog]);

  return (
    <div className="relative w-full max-w-md">
      <Search size={16} className="absolute left-4 top-3 text-muted" aria-hidden="true" />
      <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search anything" placeholder="Search anything..." className="w-full rounded-full border border-white/60 bg-white/80 py-2.5 pl-10 pr-4 text-sm shadow-sm backdrop-blur placeholder:text-muted focus:border-blue-500" />
      {results.length > 0 && (
        <ul role="listbox" className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
          {results.map((r, i) => (
            <li key={i}><button role="option" aria-selected="false" onClick={() => { r.go(); setQ(''); }} className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-blue-50"><span className="truncate">{r.label}</span><span className="ml-3 text-xs text-muted">{r.kind}</span></button></li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Notices the user has already looked at in this session (kept across page navigation).
let seenNotices: string[] = [];

export default function Home() {
  const { settings, tasks, outbox } = useBlueStore();
  const { openDialog, openSettings, roundupOffered, reminder, setReminder, presence, setRestOverride, restOverride } = useUi();
  const nav = useNavigate();
  const { data: ws, loading } = useWorkspaceSummary();
  const [bell, setBell] = useState(false);
  const [seen, setSeenState] = useState<string[]>(seenNotices);
  const setSeen = (n: string[]) => { seenNotices = n; setSeenState(n); };

  const clock = useLiveClock(settings.timezone);
  const presenceLabel = presence === 'active' ? 'Active' : presence === 'preroll' ? 'Waking up' : presence === 'sleeping' ? 'Resting' : 'Paused';
  const presenceColor = presence === 'active' ? 'bg-emerald-500' : presence === 'preroll' ? 'bg-amber-400' : 'bg-slate-400';

  const open = tasks.filter((t) => t.status === 'todo');
  const doneToday = tasks.filter((t) => t.completedAt && now().getTime() - new Date(t.completedAt).getTime() < 86_400_000).length;
  const priorities = [...open].sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group)).slice(0, 6);
  const first = settings.name.split(' ')[0];
  const resting = (presence === 'sleeping') && !restOverride;
  const notices = [reminder, roundupOffered ? "Here's your roundup" : null, outbox.length ? `${outbox.length} item(s) in your demo outbox` : null].filter(Boolean) as string[];

  if (resting) {
    return (
      <div className="bg-sunrise min-h-full p-8">
        <div className="mx-auto mt-16 max-w-md rounded-3xl bg-white/80 p-8 text-center shadow-card backdrop-blur">
          <BlueMascot size={150} mood="sleep" float className="mx-auto" />
          <h1 className="mt-4 text-xl font-bold text-ink">Blue is resting outside your work hours</h1>
          <p className="mt-1 text-sm text-muted">No reading, no nudges. I wake up 30 minutes before {settings.workStart}.</p>
          <button onClick={() => setRestOverride(true)} className="btn-primary mt-5">Resume for now</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-sunrise px-4 pb-8 pt-5 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <SearchBox />
          <div className="relative flex items-center gap-3">
            {/* 4 info sections */}
            <button onClick={() => openDialog('roundup')} className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-xs font-semibold text-ink hover:bg-white transition" aria-label="Open roundup">
              <Newspaper size={15} className="text-blue-500" />
              <span>Roundup</span>
              {roundupOffered && <span className="h-2 w-2 rounded-full bg-rose-500" />}
            </button>
            <button onClick={() => openDialog('checkin')} className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-xs font-semibold text-ink hover:bg-white transition" aria-label="Check-ins">
              <ClipboardCheck size={15} className="text-emerald-500" />
              <span>Check-ins</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-xs font-semibold text-ink" aria-label="Blue status">
              <span className={`h-2 w-2 rounded-full ${presenceColor}`} />
              <span>{presenceLabel}</span>
              <span className="text-muted font-normal">{settings.workStart}–{settings.workEnd}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-xs font-semibold text-ink tabular-nums" aria-label="Live clock">
              <Clock size={15} className="text-indigo-500" />
              <span>{clock.time}</span>
              <span className="text-muted font-normal">{clock.date}</span>
            </div>

            <button onClick={() => { setBell(!bell); setSeen(notices); }} aria-label={`Notifications${notices.length ? ` (${notices.length})` : ''}`} aria-expanded={bell} className="relative rounded-full bg-white/70 p-2.5 text-ink hover:bg-white">
              <Bell size={18} />{notices.some((n) => !seen.includes(n)) && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />}
            </button>
            <button onClick={() => openSettings('about')} aria-label="Help and about Blue" className="rounded-full bg-white/70 p-2.5 text-ink hover:bg-white"><HelpCircle size={18} /></button>
            <button onClick={() => openSettings()} aria-label="Open settings" className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">{initials(settings.name)}</button>
            {bell && (
              <div role="region" aria-label="Notifications" className="absolute right-0 top-12 z-20 w-72 rounded-2xl border border-slate-100 bg-white p-3 text-sm shadow-xl animate-pop">
                {notices.length === 0 ? <p className="p-2 text-muted">You're all caught up.</p> : notices.map((n) => (
                  <button key={n} onClick={() => { if (n === reminder) setReminder(null); if (n.startsWith("Here's")) openDialog('roundup'); if (n.includes('outbox')) nav('/outbox'); setBell(false); }} className="block w-full rounded-lg p-2 text-left hover:bg-blue-50">{n}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">Good {greeting(now(), settings.timezone)}, {first}! ☀️</h1>
            <p className="mt-1 text-sm text-muted sm:text-base">Here's your roundup for today. Let's make it count!</p>
            <button onClick={() => openDialog('roundup')} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-blue-600 shadow-card hover:bg-blue-50">
              <Sparkles size={15} /> Your day, simplified {roundupOffered && <span className="h-2 w-2 rounded-full bg-rose-500" aria-label="new" />} <ChevronRight size={15} />
            </button>
          </div>
          <div className="relative hidden flex-shrink-0 sm:block">
            <BlueMascot size={190} mood="happy" float />
            <span className="absolute -top-1 right-0 rounded-2xl bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-card">Small steps. Big progress! ✨</span>
          </div>
        </div>
      </section>

      {reminder && (
        <div role="status" className="mx-4 mt-4 flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-2.5 text-sm text-blue-800 sm:mx-8">
          <span>{reminder}</span><button onClick={() => setReminder(null)} className="text-xs font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      <div className="grid gap-5 px-4 py-6 sm:px-8 lg:grid-cols-2">
        <Card className="p-5">
          <CardHeader icon={<ListChecks size={16} />} title="Today's Priorities" action={<button onClick={() => nav('/tasks')} className="text-xs font-semibold text-blue-600 hover:underline">View all →</button>} />
          {priorities.length === 0 ? (
            <EmptyState title="Nothing here yet" hint={settings.allowConnectors ? 'Open your roundup and I will sort your day.' : 'Connect the Demo Workspace in Settings, or add a task yourself.'}
              action={<button onClick={() => openDialog(settings.allowConnectors ? 'roundup' : 'createTask')} className="btn-primary">{settings.allowConnectors ? 'Open roundup' : 'Create task'}</button>} />
          ) : <ul>{priorities.map((t) => <TaskRow key={t.id} task={t} />)}</ul>}
        </Card>

        <Card className="p-5">
          <CardHeader icon={<Users size={16} />} title="Team Updates" action={<button onClick={() => openDialog('roundup')} className="text-xs font-semibold text-blue-600 hover:underline">View all →</button>} />
          {settings.paused ? (
            <EmptyState title="Blue is paused" hint="Nothing is being read. Updates return when you resume Blue." />
          ) : !settings.allowConnectors ? (
            <EmptyState title="No sources connected" hint="Turn on the Demo Workspace to see Slack, Gmail and Calendar updates here." action={<button onClick={() => openSettings('connectors')} className="btn-primary">Open connectors</button>} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {messages.slice(0, 3).map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><Hash size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{m.from} <span className="font-normal text-muted">in {m.channel}</span></p>
                    <p className="truncate text-xs text-muted">{m.text}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-muted">{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </li>
              ))}
              {emails.slice(0, 2).map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500"><Mail size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{e.subject}</p>
                    <p className="truncate text-xs text-muted">{e.from}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-muted">{new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </li>
              ))}
              {calendarEvents.slice(0, 1).map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500"><CalIcon size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{c.title}</p>
                    <p className="truncate text-xs text-muted">{c.attendees.join(', ')}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-muted">{new Date(c.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[11px] text-muted">Read-only preview. Blue never stores message bodies.</p>
        </Card>

        <Card className="flex items-center bg-card-soft p-5">
          <div className="flex w-full items-center gap-4">
            <BlueMascot size={96} mood="encouraging" float />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-blue-600">{doneToday ? 'Great job on your recent tasks!' : 'Ready when you are.'}</p>
              <p className="mt-1 text-xs text-muted">{doneToday ? `You closed ${doneToday} task${doneToday === 1 ? '' : 's'} recently. That's the Blue way!` : 'Pick one small thing and I will cheer quietly from here.'}</p>
              <button onClick={() => nav('/tasks')} className="mt-3 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-blue-600 shadow-sm hover:bg-blue-50">{doneToday ? 'Keep it up! 💙' : 'See my tasks 💙'}</button>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-semibold text-ink">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-2">
            {([
              ['Ask Blue', MessageSquare, () => nav('/chat')],
              ['Summarize', FileText, () => openDialog('summarize')],
              ['Write', PenLine, () => openDialog('write')],
              ['Find Help', LifeBuoy, () => openDialog('askSenior')],
              ['Create Task', PlusSquare, () => openDialog('createTask')],
              ['More', MoreHorizontal, () => openDialog('moreMenu')],
            ] as const).map(([label, Icon, fn]) => (
              <button key={label} onClick={fn} className="flex flex-col items-center gap-2 rounded-2xl p-3 text-xs font-medium text-ink transition hover:bg-blue-50">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-500"><Icon size={20} /></span>{label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="px-4 pb-8 sm:px-8">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold text-ink">Your Team at a Glance</h2>
          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            {settings.allowTeamContext ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[{ id: 'me', name: `${first} (You)`, status: 'on_track' as const }, ...TEAM].map((m) => {
                  const [label, cls] = STATUS[(m.status ?? 'on_track') as keyof typeof STATUS];
                  return (
                    <li key={m.id} className="flex flex-col items-center text-center">
                      {'avatar' in m && m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">{initials(m.name)}</span>
                      )}
                      <span className="mt-1 text-sm font-medium text-ink">{m.name.split(' ')[0]}</span>
                      <span className={`text-xs font-semibold ${cls}`}>{label}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-muted">
                <Users size={18} /> Teammates choose what they share. Turn on team context to see what they've opted to share.
                <button onClick={() => openSettings()} className="ml-auto text-xs font-semibold text-blue-600 hover:underline">Settings</button>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-blue-50 p-4">
              <div><p className="text-sm font-semibold text-ink">Need help with something?</p><p className="mt-0.5 text-xs text-muted">Ask Blue, or request support from your team. It's a sign of strength, not weakness.</p></div>
              <button onClick={() => openDialog('askSenior')} aria-label="Request support from your team" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow hover:bg-blue-600"><Plus size={20} /></button>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted">Statuses are self-declared by each teammate and shared by choice. Blue never infers them, and there is no manager view.</p>
        </Card>
      </div>
    </div>
  );
}
