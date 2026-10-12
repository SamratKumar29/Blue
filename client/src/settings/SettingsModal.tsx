import React, { useState, useEffect, useRef } from 'react';
import {
  Settings, Shield, Cpu, Plug, Bell, Clock, Palette, Info, X
} from 'lucide-react';
import { Toggle } from '../components/Toggle';

interface SettingsModalProps {
  onClose: () => void;
  initialSection?: string;
}

export default function SettingsModal({ onClose, initialSection = 'general' }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState(initialSection);
  const modalRef = useRef<HTMLDivElement>(null);

  // Form states for General
  const [name, setName] = useState('Alex Johnson');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [presence, setPresence] = useState<'work_hours' | 'laptop_awake'>('work_hours');
  const [allowWriting, setAllowWriting] = useState(false);
  const [allowConnectors, setAllowConnectors] = useState(false);
  const [allowTeamContext, setAllowTeamContext] = useState(false);

  // Esc key and focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  const navItems = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
    { id: 'ai-model', label: 'AI Model', icon: Cpu },
    { id: 'connectors', label: 'Connectors', icon: Plug },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'work-hours', label: 'Work Hours', icon: Clock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative flex flex-col md:flex-row w-full max-w-[900px] h-[650px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 outline-none"
      >
        {/* Left Navigation Bar */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-6 px-2">
            <Settings className="text-blue-600" size={22} />
            <h2 id="settings-title" className="text-lg font-bold text-ink">Settings</h2>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
                  }`}
                  aria-selected={isActive}
                >
                  <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-200 px-2 text-xs text-muted">
            Blue v0.1.0 · Google Cloud AI 2026
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-ink capitalize">
              {navItems.find(i => i.id === activeTab)?.label}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-ink hover:bg-slate-100 transition-colors"
              aria-label="Close settings"
            >
              <X size={20} />
            </button>
          </div>

          {/* Section Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'general' && (
              <div className="space-y-6 max-w-lg">
                <div>
                  <label htmlFor="user-name" className="block text-sm font-medium text-ink mb-1">
                    Your Name
                  </label>
                  <input
                    id="user-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label htmlFor="timezone-select" className="block text-sm font-medium text-ink mb-1">
                    Timezone
                  </label>
                  <select
                    id="timezone-select"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Asia/Kolkata">(GMT+5:30) India Standard Time</option>
                    <option value="Asia/Tokyo">(GMT+9:00) Japan Standard Time</option>
                    <option value="Asia/Singapore">(GMT+8:00) Singapore Standard Time</option>
                    <option value="Australia/Sydney">(GMT+10:00) Australian Eastern Time</option>
                    <option value="UTC">(GMT+0:00) Coordinated Universal Time</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="language-select" className="block text-sm font-medium text-ink mb-1">
                    Language
                  </label>
                  <select
                    id="language-select"
                    disabled
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-500 bg-slate-50 cursor-not-allowed"
                  >
                    <option value="en">English (default)</option>
                  </select>
                  <p className="text-xs text-muted mt-1">Multilingual support is scheduled for future updates.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Blue's Presence
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPresence('work_hours')}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                        presence === 'work_hours'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-600 hover:text-ink'
                      }`}
                    >
                      Work hours only
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresence('laptop_awake')}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                        presence === 'laptop_awake'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-600 hover:text-ink'
                      }`}
                    >
                      Laptop awake
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-1.5">
                    Blue will wake 30 minutes before your workday and sleep after your work hours.
                  </p>
                </div>

                {/* Local AI Model Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Local AI Model</span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-700">
                      Active
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-ink">Gemma 4 E2B (In-browser LiteRT-LM)</p>
                  <p className="text-xs text-muted mt-1">
                    WebGPU-accelerated local reasoning. Zero latency and complete offline privacy.
                  </p>
                </div>

                {/* Privacy Quick Controls */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Privacy Quick Controls
                  </h4>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                    <div>
                      <p className="text-sm font-medium text-ink">Allow writing (with approval)</p>
                      <p className="text-xs text-muted">Preview required before any message or response is staged</p>
                    </div>
                    <Toggle
                      id="toggle-allow-writing"
                      checked={allowWriting}
                      onChange={setAllowWriting}
                      label="Allow writing"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                    <div>
                      <p className="text-sm font-medium text-ink">Allow connectors</p>
                      <p className="text-xs text-muted">Permit reading approved workspace feeds (read-only)</p>
                    </div>
                    <Toggle
                      id="toggle-allow-connectors"
                      checked={allowConnectors}
                      onChange={setAllowConnectors}
                      label="Allow connectors"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                    <div>
                      <p className="text-sm font-medium text-ink">Allow team context</p>
                      <p className="text-xs text-muted">Include team roles and expertise for senior assistance</p>
                    </div>
                    <Toggle
                      id="toggle-allow-team"
                      checked={allowTeamContext}
                      onChange={setAllowTeamContext}
                      label="Allow team context"
                    />
                  </div>
                </div>

                <div className="pt-2 pb-1">
                  <p className="text-xs font-medium text-slate-500 italic">
                    "Your data stays with you. Always. My Blue is my Blue, not your Blue."
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-4 max-w-lg">
                <p className="text-sm text-slate-600">
                  Blue operates on zero-surveillance principles. No telemetry, no manager dashboards, and no persistent external storage.
                </p>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h4 className="text-sm font-semibold text-ink">Local Memory Encryption</h4>
                  <p className="text-xs text-muted">
                    All tasks, notes, and provenance pointers are stored in browser IndexedDB encrypted via WebCrypto AES-GCM (256-bit).
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-ink transition-colors"
                  >
                    Export Memory (JSON)
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                  >
                    Clear My Blue (Wipe All)
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'ai-model' && (
              <div className="space-y-4 max-w-lg">
                <p className="text-sm text-slate-600">
                  Choose between local in-browser Gemma or high-capacity Gemini Cloud inference.
                </p>
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
                  <span className="text-xs font-bold text-blue-700 uppercase">Provider Mode</span>
                  <p className="text-sm font-semibold text-ink mt-1">Local Gemma (Recommended default)</p>
                  <p className="text-xs text-muted mt-1">
                    Runs 100% on device using WebGPU LiteRT-LM. No prompt leaves your browser.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-xs font-bold text-slate-500 uppercase">Cloud Fallback</span>
                  <p className="text-sm font-semibold text-ink mt-1">Google Gemini 3.8 Flash (Cloud Run)</p>
                  <p className="text-xs text-muted mt-1">
                    Requires explicit user consent per interaction. Enterprise privacy secured.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'connectors' && (
              <div className="space-y-3 max-w-lg">
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">Demo Workspace</p>
                    <p className="text-xs text-muted">Simulated team chats, email triage, and calendar feeds</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800">
                    Connected
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between opacity-70">
                  <div>
                    <p className="text-sm font-semibold text-ink">Slack Connector</p>
                    <p className="text-xs text-muted">Real workspace integration</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200 text-slate-600">
                    Roadmap
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between opacity-70">
                  <div>
                    <p className="text-sm font-semibold text-ink">Google Workspace (Gmail / Calendar)</p>
                    <p className="text-xs text-muted">Direct OAuth 2.0 connector</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200 text-slate-600">
                    Roadmap
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-3 max-w-lg">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <p className="text-sm font-semibold text-ink">Morning Roundup Delivery</p>
                  <p className="text-xs text-muted">Blue prepares your calm digest 30 minutes before workday start.</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <p className="text-sm font-semibold text-ink">Hydration & Ergonomic Micro-breaks</p>
                  <p className="text-xs text-muted">Gentle non-intrusive notification every 90 minutes of active focus.</p>
                </div>
              </div>
            )}

            {activeTab === 'work-hours' && (
              <div className="space-y-4 max-w-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Workday Start</label>
                    <input
                      type="time"
                      defaultValue="09:00"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Workday End</label>
                    <input
                      type="time"
                      defaultValue="17:30"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted">
                  During quiet hours, Blue ceases background feeds and enters calm standby.
                </p>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-4 max-w-lg">
                <p className="text-sm text-slate-600">Personalize Blue's visual interface.</p>
                <div className="grid grid-cols-3 gap-3">
                  <button className="p-3 rounded-xl border-2 border-blue-500 bg-white text-center text-xs font-semibold text-blue-600">
                    Light (Sunrise)
                  </button>
                  <button className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-600">
                    Dark (Navy)
                  </button>
                  <button className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-600">
                    System Default
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-3 max-w-lg">
                <h4 className="text-base font-bold text-ink">Project Blue</h4>
                <p className="text-sm text-slate-600">
                  Google Cloud AI Builder Cup 2026 entry for the Future of Work & Enterprise Productivity theme.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 text-xs text-muted space-y-1">
                  <p><strong>Architecture:</strong> Client-side React + LiteRT-LM (Gemma 4) with Cloud Run Gemini 3.8 Flash</p>
                  <p><strong>Design System:</strong> Tailwind CSS 3.4 · Lucide Icons · Inter Typography</p>
                  <p><strong>Philosophy:</strong> "My Blue is my Blue, not your Blue."</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
