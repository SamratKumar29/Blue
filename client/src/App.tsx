import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Bubble from './components/Bubble';
import SettingsModal from './settings/SettingsModal';
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
  const [settingsOpen, setSettingsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('settings') === '1';
    }
    return false;
  });

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Left sidebar */}
      <Sidebar onOpenSettings={() => setSettingsOpen(true)} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" id="main-content">
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

      {/* Floating Blue bubble */}
      <Bubble onOpenSettings={() => setSettingsOpen(true)} />

      {/* Global Settings Modal */}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
