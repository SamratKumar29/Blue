import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, CheckSquare, Users, MessageCircle } from 'lucide-react';
import BlueMascot from './BlueMascot';

interface BubbleProps {
  onOpenSettings?: () => void;
}

export default function Bubble({ onOpenSettings }: BubbleProps) {
  const [expanded, setExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('bubble') === '1';
    }
    return false;
  });
  const navigate = useNavigate();
  const bubbleRef = useRef<HTMLDivElement>(null);
  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Collapse on Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Click outside to collapse
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [expanded]);

  const navigate_and_collapse = (to: string) => {
    navigate(to);
    setExpanded(false);
  };

  return (
    <div
      ref={bubbleRef}
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2"
      data-testid="bubble-widget"
    >
      {/* Expanded card */}
      {expanded && (
        <div
          className={[
            'card w-72 p-4 mb-1',
            prefersReduced ? '' : 'animate-fade-in-up'
          ].join(' ')}
          role="dialog"
          aria-label="Blue assistant"
        >
          <div className="flex items-center gap-3 mb-3">
            <BlueMascot size={44} mood="wink" />
            <div>
              <p className="font-semibold text-ink">Hey! I'm Blue 👋</p>
              <p className="text-muted text-xs">How can I help you today?</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate_and_collapse('/tasks')}
              className="flex items-center gap-2 text-left px-3 py-2 rounded-xl hover:bg-blue-50 text-ink text-sm transition-colors"
            >
              <CheckSquare size={15} className="text-blue-500" />
              Show my tasks
            </button>
            <button
              onClick={() => navigate_and_collapse('/')}
              className="flex items-center gap-2 text-left px-3 py-2 rounded-xl hover:bg-blue-50 text-ink text-sm transition-colors"
            >
              <Users size={15} className="text-blue-500" />
              Check team updates
            </button>
            <button
              onClick={() => navigate_and_collapse('/chat')}
              className="flex items-center gap-2 text-left px-3 py-2 rounded-xl hover:bg-blue-50 text-ink text-sm transition-colors"
            >
              <MessageCircle size={15} className="text-blue-500" />
              Ask something
            </button>
          </div>

          <button
            onClick={() => { onOpenSettings?.(); setExpanded(false); }}
            className="mt-3 flex items-center gap-1.5 text-muted text-xs hover:text-ink transition-colors"
            aria-label="Open settings"
          >
            <Settings size={12} />
            Settings
          </button>
        </div>
      )}

      {/* Collapsed button */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="relative w-14 h-14 rounded-full bg-navy-900 flex items-center justify-center shadow-lg
                   hover:bg-navy-800 transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label={expanded ? 'Close Blue assistant' : 'Open Blue assistant'}
        aria-expanded={expanded}
      >
        <BlueMascot size={44} mood={expanded ? 'wink' : 'happy'} />
        {/* Status dot */}
        <span
          className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-good border-2 border-navy-900"
          aria-label="Active"
        />
      </button>
    </div>
  );
}
