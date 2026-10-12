const TEAM = [
  {
    id: 'p1', name: 'Marcus Thompson', role: 'Tech Lead', initials: 'MT', color: 'bg-blue-500',
    expertise: ['Architecture', 'APIs', 'System design'],
    timezone: 'UTC+5:30'
  },
  {
    id: 'p2', name: 'Amir Hassan', role: 'DevOps Engineer', initials: 'AH', color: 'bg-green-500',
    expertise: ['Prod incidents', 'Deployments', 'Cloud infra'],
    timezone: 'UTC+5:30'
  },
  {
    id: 'p3', name: 'Priya Kapoor', role: 'Designer', initials: 'PK', color: 'bg-purple-500',
    expertise: ['UI/UX', 'Figma', 'Design systems'],
    timezone: 'UTC+5:30'
  },
  {
    id: 'p4', name: 'Rohan Mehta', role: 'Product Manager', initials: 'RM', color: 'bg-amber-500',
    expertise: ['Product strategy', 'User research', 'Agile'],
    timezone: 'UTC+5:30'
  },
  {
    id: 'p5', name: 'Li Wei', role: 'Backend Engineer', initials: 'LW', color: 'bg-red-500',
    expertise: ['Node.js', 'Databases', 'Performance'],
    timezone: 'UTC+8'
  },
  {
    id: 'p6', name: 'Sofia Andrade', role: 'Frontend Engineer', initials: 'SA', color: 'bg-pink-500',
    expertise: ['React', 'TypeScript', 'Accessibility'],
    timezone: 'UTC+5:30'
  },
];

export default function Team() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-ink mb-2">Team</h1>
      <p className="text-muted text-sm mb-6">
        Blue can suggest team members for your tasks based on their expertise — only if you enable team context.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEAM.map(person => (
          <div key={person.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-11 h-11 rounded-full ${person.color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                {person.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink text-sm">{person.name}</p>
                <p className="text-muted text-xs">{person.role}</p>
                <p className="text-muted text-xs">{person.timezone}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {person.expertise.map(e => (
                <span key={e} className="pill bg-slate-100 text-muted text-[10px]">{e}</span>
              ))}
            </div>

            <button className="w-full btn-ghost text-blue-500 border border-blue-200 hover:bg-blue-50 text-sm py-1.5">
              Ask a senior
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
