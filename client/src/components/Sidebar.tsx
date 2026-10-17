import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, CheckSquare, Calendar, FolderOpen, Users, Grid3x3, Send, Mail, Settings, Keyboard, Moon, Sun, Sparkles, type LucideIcon } from 'lucide-react';
import { useBlueStore } from '../store';
import { useUi } from '../ui';
import BlueMascot from './BlueMascot';
import { toggleTheme } from '../settings/Appearance';
import { useGoogle } from '../core/connectors/google';

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

const utilBtn = 'flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-navy-800 hover:text-white';

export default function Sidebar() {
  const name = useBlueStore((s) => s.settings.name);
  const googleOn = useGoogle((s) => Boolean(s.token));
  // The Inbox tab appears only after a successful Google sign-in.
  const items = googleOn ? [...navItems.slice(0, 5), { path: '/inbox', label: 'Inbox', icon: Mail }, ...navItems.slice(5)] : navItems;
  const openSettings = useUi((s) => s.openSettings);
  const openDialog = useUi((s) => s.openDialog);
  const roundupOffered = useUi((s) => s.roundupOffered);
  const setShortcutsOpen = useUi((s) => s.setShortcutsOpen);
  const [dark, setDark] = useState(() => localStorage.getItem('blue-theme') === 'dark');
  useEffect(() => {
    const sync = () => setDark(localStorage.getItem('blue-theme') === 'dark');
    window.addEventListener('blue-theme-change', sync);
    return () => window.removeEventListener('blue-theme-change', sync);
  }, []);

  return (
    <>
      <nav className="hidden md:flex flex-col items-center bg-navy-900 py-4 gap-1 flex-shrink-0 h-screen sticky top-0" style={{ width: 'var(--sidebar-w)' }} aria-label="Main navigation">
        <button onClick={() => openDialog('roundup')} className="relative mb-3 rounded-2xl p-1 transition hover:bg-navy-800 hover:scale-105" aria-label="Open Morning Roundup" title="Morning Roundup">
          <BlueMascot size={44} mood={roundupOffered ? 'excited' : 'happy'} />
          <span aria-hidden="true" className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-navy-900 ring-2 ring-navy-900 ${roundupOffered ? 'animate-pulse' : ''}`}>
            <Sparkles size={11} />
          </span>
        </button>
        <div className="flex-1 flex flex-col items-center gap-0.5 w-full px-1">
          {items.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} aria-label={label} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
        <div className="flex flex-col items-center gap-2 pb-2">
          <div className="flex gap-1">
            <button onClick={() => setShortcutsOpen(true)} className={utilBtn} aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)"><Keyboard size={17} /></button>
            <button onClick={() => setDark(toggleTheme() === 'dark')} className={utilBtn} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} title="Toggle theme (D)">
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
          <button onClick={() => openSettings()} className="sidebar-item" aria-label="Open settings"><Settings size={20} /><span>Settings</span></button>
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white" aria-hidden="true">{initials(name)}</div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-navy-900" aria-label="Online" role="img" />
            </div>
            <span className="mt-1 max-w-[64px] truncate text-[10px] text-slate-300">{name.split(' ')[0]}</span>
            <span className="max-w-[64px] truncate text-[9px] text-slate-500">New joiner</span>
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
