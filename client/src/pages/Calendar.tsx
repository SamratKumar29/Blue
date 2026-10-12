import { Clock, Users } from 'lucide-react';

const EVENTS = [
  { id: 'e1', title: 'Design Sync', time: '11:00 – 11:30', attendees: ['Alex', 'Priya', 'Rohan'], color: 'bg-blue-500' },
  { id: 'e2', title: 'Sprint Demo Review', time: '15:00 – 15:30', attendees: ['Alex', 'Team'], color: 'bg-purple-500' },
  { id: 'e3', title: '1:1 with Marcus', time: '16:00 – 16:20', attendees: ['Alex', 'Marcus'], color: 'bg-green-500' },
  { id: 'e4', title: 'Orion Billing standup', time: '17:00 – 17:15', attendees: ['Alex', 'Orion Team'], color: 'bg-amber-500' },
];

const now = new Date();
const label = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export default function Calendar() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-ink mb-1">Calendar</h1>
      <p className="text-muted text-sm mb-6">{label}</p>

      <div className="space-y-3">
        {EVENTS.map(ev => (
          <div key={ev.id} className="card px-5 py-4 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-1 h-12 rounded-full ${ev.color} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink text-sm">{ev.title}</p>
              <p className="flex items-center gap-1 text-xs text-muted mt-0.5">
                <Clock size={11} />
                {ev.time}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted">
              <Users size={12} />
              {ev.attendees.length}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 card p-4 text-center text-muted text-sm">
        <p>📅 Calendar is read-only. Blue reads events to help with your roundup.</p>
        <p className="text-xs mt-1">Real Google Calendar sync is a roadmap feature.</p>
      </div>
    </div>
  );
}
