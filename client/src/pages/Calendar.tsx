import { useEffect, useMemo, useState } from 'react';
import calendarData from '../data/calendar.json';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Users, Clock, ExternalLink, LifeBuoy, Video, CheckSquare } from 'lucide-react';
import { useBlueStore } from '../store';
import { useUi } from '../ui';
import { Card, EmptyState } from '../components/ui';
import type { Task } from '../core/types';

// --- date helpers (no library) ---

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function daysInMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function formatDate(d: Date, opts: Intl.DateTimeFormatOptions) { return d.toLocaleDateString(undefined, opts); }

function mondayOf(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

// --- types ---

interface CalEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  who: string[];
  scheduled: boolean;
  isTask?: boolean;
  project?: string;
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fmt = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function resolveDueDate(label: string, today: Date): Date | null {
  const l = label.toLowerCase().replace(/,/g, '').trim();
  if (l === 'today') return new Date(today);
  if (l === 'tomorrow') return addDays(today, 1);
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const nextPrefix = l.startsWith('next ');
  const search = nextPrefix ? l.replace('next ', '') : l;
  const idx = dayNames.findIndex((d) => search.startsWith(d));
  if (idx === -1) return null;
  const todayDay = today.getDay();
  let diff = idx - todayDay;
  if (diff <= 0) diff += 7;
  if (nextPrefix) diff += 7;
  return addDays(today, diff);
}

function parseTime(timeStr: string): { h: number; m: number } | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
  return { h, m };
}

function taskToEvent(task: Task, today: Date): CalEvent | null {
  if (!task.dueDate) return null;
  const date = resolveDueDate(task.dueDate, today);
  if (!date) return null;
  const time = task.dueTime ? parseTime(task.dueTime) : null;
  if (time) { date.setHours(time.h, time.m, 0, 0); }
  else { date.setHours(9, 0, 0, 0); }
  const end = new Date(date.getTime() + task.estimateMin * 60_000);
  return {
    id: `task-cal-${task.id}`,
    title: task.title,
    start: date.toISOString(),
    end: end.toISOString(),
    who: [],
    scheduled: false,
    isTask: true,
    project: task.project,
  };
}

export default function Calendar() {
  const allow = useBlueStore((s) => s.settings.allowConnectors && s.meta.sources['demo-calendar']);
  const tasks = useBlueStore((s) => s.tasks);
  const outbox = useBlueStore((s) => s.outbox).filter((o) => o.kind === 'event' && o.when);
  const openDialog = useUi((s) => s.openDialog);

  // --- live today, refreshes at midnight ---
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const nextMidnight = new Date(today);
    nextMidnight.setHours(24, 0, 0, 0);
    const ms = nextMidnight.getTime() - Date.now();
    const id = setTimeout(() => setToday(new Date()), ms);
    return () => clearTimeout(id);
  }, [today]);

  // --- navigation state ---
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(() => new Date(today));

  // --- events ---
  const taskEvents: CalEvent[] = useMemo(() =>
    tasks.filter((t) => t.status === 'todo' && t.dueDate).map((t) => taskToEvent(t, today)).filter((e): e is CalEvent => e !== null),
    [tasks, today]);

  const events: CalEvent[] = useMemo(() => [
    ...(allow ? calendarData.map((e) => ({ id: e.id, title: e.title, start: e.start, end: e.end, who: e.attendees, scheduled: false })) : []),
    ...outbox.map((o) => ({ id: o.id, title: o.content.split('\n')[0].replace('Meeting: ', ''), start: o.when!, end: o.when!, who: [o.recipient], scheduled: true })),
    ...taskEvents,
  ].sort((a, b) => a.start.localeCompare(b.start)), [allow, outbox, taskEvents]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    for (const e of events) {
      const d = new Date(e.start);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      (map[key] ??= []).push(e);
    }
    return map;
  }, [events]);

  const getEvents = (d: Date) => eventsByDay[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`] ?? [];

  // --- derived: weekdays Mon-Fri for selected date ---
  const weekDays = useMemo(() => {
    const mon = mondayOf(selectedDate);
    return Array.from({ length: 5 }, (_, i) => addDays(mon, i));
  }, [selectedDate]);

  // --- derived: month grid (Mon-first) ---
  const monthGrid = useMemo(() => {
    const first = startOfMonth(viewMonth);
    let leading = first.getDay() - 1;
    if (leading < 0) leading = 6;
    const total = daysInMonth(viewMonth);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  const monthLabel = formatDate(viewMonth, { month: 'long', year: 'numeric' });
  const weekRangeLabel = `${formatDate(weekDays[0], { month: 'short', day: 'numeric' })} – ${formatDate(weekDays[4], { month: 'short', day: 'numeric' })}`;

  // --- navigation handlers ---
  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  const goToday = () => { setViewMonth(startOfMonth(today)); setSelectedDate(new Date(today)); };
  const selectDate = (d: Date) => { setSelectedDate(d); setViewMonth(startOfMonth(d)); };
  const prevWeek = () => setSelectedDate(addDays(mondayOf(selectedDate), -7));
  const nextWeek = () => setSelectedDate(addDays(mondayOf(selectedDate), 7));

  // --- featured meeting: first event today ---
  const featuredEvent = getEvents(today)[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500"><CalIcon size={22} /></span>
          <div>
            <h1 className="text-2xl font-bold text-ink">Calendar</h1>
            <p className="text-sm text-muted">{formatDate(today, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50 transition">Today</button>
          <button onClick={() => openDialog('askSenior')} className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition flex items-center gap-1.5">
            <LifeBuoy size={15} /> Schedule Senior Help
          </button>
        </div>
      </div>

      {/* Two-column: mini-month + week strip */}
      <div className="grid gap-5 lg:grid-cols-12 mb-5">
        {/* Mini month calendar */}
        <Card className="p-4 lg:col-span-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} aria-label="Previous month" className="rounded-lg p-1.5 hover:bg-slate-100 transition"><ChevronLeft size={18} /></button>
            <h3 className="text-sm font-bold text-ink">{monthLabel}</h3>
            <button onClick={nextMonth} aria-label="Next month" className="rounded-lg p-1.5 hover:bg-slate-100 transition"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAY_HEADERS.map((d) => <div key={d} className="text-center text-[10px] font-semibold text-muted py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {monthGrid.map((cell, i) => {
              if (!cell) return <div key={`b${i}`} className="h-8" />;
              const isT = isSameDay(cell, today);
              const isSel = isSameDay(cell, selectedDate);
              const hasEv = getEvents(cell).length > 0;
              return (
                <button
                  key={cell.getTime()}
                  onClick={() => selectDate(cell)}
                  className={`relative flex h-8 items-center justify-center rounded-lg text-xs font-medium transition
                    ${isT ? 'bg-blue-500 text-white font-bold' : isSel ? 'bg-blue-100 text-blue-700' : 'text-ink hover:bg-slate-100'}`}
                >
                  {cell.getDate()}
                  {hasEv && <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${isT ? 'bg-white' : 'bg-blue-400'}`} />}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Week strip Mon-Fri */}
        <Card className="p-4 lg:col-span-8">
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevWeek} aria-label="Previous week" className="rounded-lg p-1.5 hover:bg-slate-100 transition"><ChevronLeft size={18} /></button>
            <h3 className="text-sm font-bold text-ink">{weekRangeLabel}</h3>
            <button onClick={nextWeek} aria-label="Next week" className="rounded-lg p-1.5 hover:bg-slate-100 transition"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {weekDays.map((d) => {
              const isT = isSameDay(d, today);
              const isSel = isSameDay(d, selectedDate);
              const dayEvents = getEvents(d);
              return (
                <button
                  key={d.getTime()}
                  onClick={() => setSelectedDate(d)}
                  className={`rounded-2xl border p-3 text-left transition
                    ${isSel ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted">{formatDate(d, { weekday: 'short' })}</span>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold
                      ${isT ? 'bg-blue-500 text-white' : 'text-ink'}`}>{d.getDate()}</span>
                  </div>
                  {dayEvents.length > 0 ? (
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <div key={e.id} className={`truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium ${e.isTask ? 'bg-amber-100 text-amber-700' : e.scheduled ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'}`}>
                          {fmt(e.start).replace(/^0/, '')} {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && <p className="text-[10px] text-muted">+{dayEvents.length - 3} more</p>}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted">No events</p>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Featured meeting banner */}
      {featuredEvent && (
        <Card className="mb-5 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white"><Video size={24} /></span>
              <div>
                <p className="font-bold text-white text-lg">{featuredEvent.title}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-blue-100">
                  <span className="flex items-center gap-1"><Clock size={13} /> {fmt(featuredEvent.start)} – {fmt(featuredEvent.end)}</span>
                  <span className="flex items-center gap-1"><Users size={13} /> {featuredEvent.who.length} attendee{featuredEvent.who.length !== 1 ? 's' : ''}</span>
                </div>
                <p className="mt-1 text-xs text-blue-200">{featuredEvent.who.join(', ')}</p>
              </div>
            </div>
            <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer" className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition">
              Join Meet <ExternalLink size={14} />
            </a>
          </div>
        </Card>
      )}

      {/* Workspace events for selected date */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink">
            {formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' })}
            {isSameDay(selectedDate, today) && <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white align-middle">Today</span>}
          </h2>
          <span className="text-xs text-muted">{events.length} event{events.length !== 1 ? 's' : ''} total</span>
        </div>
        {(() => {
          const dayEvents = getEvents(selectedDate);
          if (dayEvents.length === 0) return <p className="py-6 text-center text-sm text-muted">No events on this day.</p>;
          return (
            <div className="grid gap-3 sm:grid-cols-2">
              {dayEvents.map((e) => (
                <div key={e.id} className={`rounded-2xl p-4 transition hover:scale-[1.01] ${e.isTask ? 'bg-amber-50 ring-1 ring-amber-200' : e.scheduled ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-slate-50 hover:bg-slate-100'}`}>
                  <p className="font-semibold text-ink">
                    {e.isTask && <CheckSquare size={14} className="inline mr-1.5 text-amber-600" />}
                    {e.title}
                    {e.scheduled && <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white">Senior Support</span>}
                    {e.isTask && <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">Task</span>}
                  </p>
                  {e.project && <p className="mt-0.5 text-xs text-muted">{e.project}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                    <span className="flex items-center gap-1"><Clock size={12} /> {fmt(e.start)} – {fmt(e.end)}</span>
                  </div>
                  {e.who.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted">
                      <Users size={12} /> <span className="truncate">{e.who.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        {isSameDay(selectedDate, today) && tasks.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><CheckSquare size={15} className="text-amber-600" /> All tasks ({tasks.length})</h3>
            <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
              {[...tasks].sort((a, b) => (taskToEvent(a, today)?.start ?? '9').localeCompare(taskToEvent(b, today)?.start ?? '9')).map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${t.status === 'done' ? 'bg-good' : 'bg-amber-500'}`} />
                  <span className={`flex-1 truncate ${t.status === 'done' ? 'text-muted line-through' : 'text-ink'}`}>{t.title}</span>
                  <span className="hidden truncate text-xs text-muted sm:inline">{t.project}</span>
                  <span className="flex-shrink-0 text-xs text-muted">{t.dueTime ?? t.dueDate ?? 'No due date'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {events.length === 0 && (
        <Card className="mt-4"><EmptyState title="Nothing here yet" hint="Connect the Demo Workspace in Settings, or schedule a meeting from Senior Help." /></Card>
      )}
    </div>
  );
}
