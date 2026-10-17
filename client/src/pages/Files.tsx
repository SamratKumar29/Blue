import { useEffect, useRef, useState } from 'react';
import { Lock, FileText, ChevronDown, ChevronUp, Upload, Trash2, File, Image, FileSpreadsheet } from 'lucide-react';
import { DOC_NAMES, docText, canUsePolicy } from '../core/features/retrieval';
import { useBlueStore } from '../store';
import { Card, EmptyState } from '../components/ui';
import { saveUpload, listUploads, removeUpload, type UploadedFile } from '../core/memory/files';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string) {
  if (type.startsWith('image/')) return <Image size={18} />;
  if (type.includes('spreadsheet') || type.includes('csv') || type.includes('excel')) return <FileSpreadsheet size={18} />;
  if (type.includes('pdf') || type.includes('text') || type.includes('document')) return <FileText size={18} />;
  return <File size={18} />;
}

export default function Files() {
  useBlueStore((s) => s.settings.allowTeamContext);
  useBlueStore((s) => s.settings.allowConnectors);
  const showToast = useBlueStore((s) => s.showToast);
  const allowed = canUsePolicy();
  const [open, setOpen] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { listUploads().then(setUploads).catch(() => setUploads([])); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const saved = await Promise.all(Array.from(files).map(saveUpload));
    setUploads((prev) => [...saved, ...prev]);
    showToast(`${saved.length} file${saved.length > 1 ? 's' : ''} added`);
    e.target.value = '';
  };

  const removeFile = async (id: string) => {
    await removeUpload(id);
    setUploads((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">Files</h1>
          <p className="text-sm text-muted">Approved documents Blue may read to ground its answers.</p>
        </div>
        <div>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={handleUpload} aria-label="Upload files" />
          <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 active:scale-95 transition">
            <Upload size={16} /> Upload Files
          </button>
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-ink">Uploaded Files</h2>
          <ul className="space-y-2">
            {uploads.map((f) => (
              <li key={f.id}>
                <Card className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500">{fileIcon(f.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{f.name}</p>
                    <p className="text-xs text-muted">{formatSize(f.size)} · Added {new Date(f.addedAt).toLocaleString()} · {f.text ? 'Blue can search this' : f.skipped}</p>
                  </div>
                  <button onClick={() => removeFile(f.id)} aria-label={`Remove ${f.name}`} className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-500 transition">
                    <Trash2 size={16} />
                  </button>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold text-ink">Policy Documents</h2>
      {!allowed ? (
        <Card><EmptyState title="Policy documents are off" hint="Turn on team context or the policy source in Settings to let Blue cite these." /></Card>
      ) : (
        <ul className="space-y-3">
          {DOC_NAMES().map((d) => (
            <li key={d}>
              <Card className="p-4">
                <button onClick={() => setOpen(open === d ? null : d)} aria-expanded={open === d} className="flex w-full items-center gap-3 text-left">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500"><FileText size={18} /></span>
                  <span className="flex-1 font-semibold text-ink">{d.replace(/[-_]/g, ' ')}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-muted"><Lock size={11} /> read-only</span>
                  {open === d ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                </button>
                {open === d && <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-sans text-sm text-ink">{docText(d)}</pre>}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
