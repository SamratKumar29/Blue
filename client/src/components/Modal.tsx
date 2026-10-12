import { useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from './useFocusTrap';
import BlueMascot, { type MascotMood } from './BlueMascot';

interface ModalProps {
  title: string;
  subtitle?: string;
  mood?: MascotMood;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  hideHeader?: boolean;
}

export default function Modal({ title, subtitle, mood = 'happy', onClose, children, footer, wide, hideHeader }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, onClose);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-900/45 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-pop ${wide ? 'max-w-3xl' : 'max-w-xl'}`}
      >
        {!hideHeader && (
          <div className="flex items-center gap-3 border-b border-slate-100 bg-card-soft px-5 py-3">
            <BlueMascot size={52} mood={mood} />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-semibold text-ink">{title}</h2>
              {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
            </div>
            <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-muted hover:bg-white/70"><X size={18} /></button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export const btnPrimary = 'rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 active:scale-95 transition disabled:opacity-40';
export const btnGhost = 'rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50 transition';
