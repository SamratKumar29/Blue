import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import { useUi } from './ui';
import Bubble from './components/Bubble';
import SettingsModal from './settings/SettingsModal';
import ApprovalDialog from './components/ApprovalDialog';
import PermissionCenter from './components/PermissionCenter';
import DialogHost from './components/DialogHost';
import DemoClockPanel from './components/DemoClockPanel';
import { startScheduler } from './core/presence/scheduler';
import { applyAppearance, toggleTheme } from './settings/Appearance';
import { useBlueStore } from './store';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Files from './pages/Files';
import Team from './pages/Team';
import Apps from './pages/Apps';
import Outbox from './pages/Outbox';

export default function App() {
  const loadAll = useBlueStore((s) => s.loadAll);
  const initialized = useBlueStore((s) => s.initialized);
  const onboarded = useBlueStore((s) => s.meta.onboarded);
  const offlineDemo = useBlueStore((s) => s.offlineDemo);
  const navigate = useNavigate();

  useEffect(() => {
    applyAppearance();
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!initialized || !onboarded) return;
    return startScheduler();
  }, [initialized, onboarded]);

  useEffect(() => {
    const routes: Record<string, string> = { h: '/', m: '/chat', t: '/tasks', b: '/team', c: '/calendar', f: '/files', a: '/apps', o: '/outbox' };
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      const ui = useUi.getState();
      if (e.key === 'Escape') {
        if (ui.shortcutsOpen) ui.setShortcutsOpen(false);
        else if (ui.dialog) ui.closeDialog();
        else if (ui.settingsOpen) ui.closeSettings();
        return;
      }
      // Don't navigate underneath an open dialog or before onboarding.
      if (ui.dialog || ui.settingsOpen || !useBlueStore.getState().meta.onboarded) return;
      if (e.key === '?') { e.preventDefault(); ui.setShortcutsOpen(!ui.shortcutsOpen); return; }
      if (ui.shortcutsOpen) return;
      const k = e.key.toLowerCase();
      if (routes[k]) { e.preventDefault(); navigate(routes[k]); }
      else if (k === 'r') { e.preventDefault(); ui.openDialog('roundup'); }
      else if (k === 's') { e.preventDefault(); ui.openSettings(); }
      else if (k === 'd') { e.preventDefault(); toggleTheme(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  if (!initialized) {
    return <div className="flex h-screen items-center justify-center bg-sunrise"><img src="/blue-small.png" alt="Loading Blue" width={96} className="animate-float" /></div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0" id="main-content">
        {offlineDemo && (
          <div role="status" className="bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-700">
            Offline demo mode: no AI model is reachable, so Blue is showing sample output. Nothing was sent anywhere.
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/files" element={<Files />} />
          <Route path="/team" element={<Team />} />
          <Route path="/apps" element={<Apps />} />
          <Route path="/outbox" element={<Outbox />} />
        </Routes>
      </main>
      <Bubble />
      <DialogHost />
      <SettingsModal />
      <ApprovalDialog />
      <DemoClockPanel />
      <KeyboardShortcutsModal />
      {!onboarded && <PermissionCenter />}
    </div>
  );
}
