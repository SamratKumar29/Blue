import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, CheckSquare, Calendar, FolderOpen, Users, Grid3x3, Send, Settings, type LucideIcon } from 'lucide-react';
import { useBlueStore } from '../store';
import { useUi } from '../ui';

const navItems: { path: string; label: string; icon: LucideIcon }[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/team', label: 'Team', icon: Users },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/files', label: 'Files', icon: FolderOpen },
  { path: '/apps', label: 'Apps', icon: Grid3x3 },
  { path: '/outbox', label: 'Outbox', icon: Send },
];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'B';
}

export default function Sidebar() {
  const name = useBlueStore((s) => s.settings.name);
  const openSettings = useUi((s) => s.openSettings);

  return (
    <>
      <nav className="hidden md:flex flex-col items-center bg-navy-900 py-4 gap-1 flex-shrink-0 h-screen sticky top-0" style={{ width: 'var(--sidebar-w)' }} aria-label="Main navigation">
        <img src="/blue-small.png" alt="Blue" width={44} className="mb-3" />
        <div className="flex-1 flex flex-col items-center gap-0.5 w-full px-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} aria-label={label} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
        <div className="flex flex-col items-center gap-3 pb-2">
          <button onClick={() => openSettings()} className="sidebar-item" aria-label="Open settings"><Settings size={20} /><span>Settings</span></button>
          <div className="flex flex-col items-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white" aria-hidden="true">{initials(name)}</div>
            <span className="mt-1 max-w-[64px] truncate text-[10px] text-slate-300">{name.split(' ')[0]}</span>
          </div>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-navy-900 px-1 py-1" aria-label="Main navigation">
        {navItems.filter((n) => ['/', '/chat', '/tasks', '/team', '/calendar'].includes(n.path)).map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} end={path === '/'} aria-label={label}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium ${isActive ? 'bg-navy-800 text-white' : 'text-slate-400'}`}>
            <Icon size={18} /><span>{label}</span>
          </NavLink>
        ))}
        <button onClick={() => openSettings()} aria-label="Open settings" className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium text-slate-400"><Settings size={18} /><span>Settings</span></button>
      </nav>
    </>
  );
}
