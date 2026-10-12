import { useRef, type ComponentType } from 'react';
import { Settings, Shield, Cpu, Plug, Bell, Clock, Palette, Info, X, type LucideIcon } from 'lucide-react';
import { useUi } from '../ui';
import { useFocusTrap } from '../components/useFocusTrap';
import General from './General';
import PrivacyData from './PrivacyData';
import AiModel from './AiModel';
import Connectors from './Connectors';
import Notifications from './Notifications';
import WorkHours from './WorkHours';
import Appearance from './Appearance';
import About from './About';

const SECTIONS: { id: string; label: string; icon: LucideIcon; Comp: ComponentType }[] = [
  { id: 'general', label: 'General', icon: Settings, Comp: General },
  { id: 'privacy', label: 'Privacy & Data', icon: Shield, Comp: PrivacyData },
  { id: 'ai', label: 'AI Model', icon: Cpu, Comp: AiModel },
  { id: 'connectors', label: 'Connectors', icon: Plug, Comp: Connectors },
  { id: 'notifications', label: 'Notifications', icon: Bell, Comp: Notifications },
  { id: 'hours', label: 'Work Hours', icon: Clock, Comp: WorkHours },
  { id: 'appearance', label: 'Appearance', icon: Palette, Comp: Appearance },
  { id: 'about', label: 'About', icon: Info, Comp: About },
];

export default function SettingsModal() {
  const { settingsOpen, settingsSection, openSettings, closeSettings } = useUi();
  if (!settingsOpen) return null;
  return <Modal section={settingsSection} setSection={openSettings} close={closeSettings} />;
}

function Modal({ section, setSection, close }: { section: string; setSection: (s: string) => void; close: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, close);
  const active = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];
  const Comp = active.Comp;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 backdrop-blur-sm p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label="Settings" className="flex h-[min(720px,92vh)] w-full max-w-[900px] overflow-hidden rounded-2xl bg-white shadow-2xl animate-pop">
        <nav aria-label="Settings sections" className="hidden sm:flex w-52 flex-shrink-0 flex-col gap-1 border-r border-slate-100 bg-slate-50/60 p-3">
          <div className="flex items-center gap-2 px-2 py-2 mb-1">
            <img src="/blue-small.png" alt="" width={34} />
            <span className="font-semibold text-ink">Settings</span>
          </div>
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              aria-current={id === active.id ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-left transition-colors ${
                id === active.id ? 'bg-blue-50 text-blue-600' : 'text-muted hover:bg-white hover:text-ink'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 relative">
          <button onClick={close} aria-label="Close settings" className="absolute right-4 top-4 rounded-lg p-2 text-muted hover:bg-slate-100"><X size={18} /></button>
          <select className="sm:hidden mb-4 w-full rounded-xl border border-slate-200 p-2 text-sm" aria-label="Settings section" value={active.id} onChange={(e) => setSection(e.target.value)}>
            {SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <Comp />
        </div>
      </div>
    </div>
  );
}
