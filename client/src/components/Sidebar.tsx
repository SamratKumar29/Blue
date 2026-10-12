import { NavLink } from 'react-router-dom';
import {
  Home, MessageCircle, CheckSquare, Calendar, FolderOpen,
  Users, Grid3x3, Send, Settings
} from 'lucide-react';
import BlueMascot from './BlueMascot';

const navItems = [
  { path: '/',         label: 'Home',     icon: Home },
  { path: '/chat',     label: 'Chat',     icon: MessageCircle },
  { path: '/tasks',    label: 'Tasks',    icon: CheckSquare },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/files',    label: 'Files',    icon: FolderOpen },
  { path: '/team',     label: 'Team',     icon: Users },
  { path: '/apps',     label: 'Apps',     icon: Grid3x3 },
  { path: '/outbox',   label: 'Outbox',   icon: Send },
];

interface SidebarProps {
  onOpenSettings: () => void;
}

export default function Sidebar({ onOpenSettings }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className="hidden md:flex flex-col items-center bg-navy-900 py-4 gap-1 flex-shrink-0 h-screen sticky top-0"
        style={{ width: 'var(--sidebar-w)' }}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center mb-4 flex-shrink-0">
          <span className="text-white font-bold text-xl" aria-label="Blue app">B</span>
        </div>

        {/* Nav items */}
        <div className="flex-1 flex flex-col items-center gap-0.5 w-full px-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                ['sidebar-item', isActive ? 'active' : ''].join(' ')
              }
              aria-label={label}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Bottom: mascot mini + user avatar */}
        <div className="flex flex-col items-center gap-3 pb-2">
          <button
            onClick={onOpenSettings}
            className="sidebar-item"
            aria-label="Open settings"
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>

          <BlueMascot size={36} mood="calm" className="opacity-80" />

          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            AJ
          </div>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-navy-900 flex items-center justify-around px-2 py-1 z-50"
        aria-label="Main navigation"
      >
        {navItems.slice(0, 5).map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              ['flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-medium transition-all',
               isActive ? 'text-white bg-navy-800' : 'text-slate-400 hover:text-white'].join(' ')
            }
            aria-label={label}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
