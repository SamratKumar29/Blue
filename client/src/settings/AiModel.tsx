import { useRef, useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { useBlueStore } from '../store';
import { useModelStatus } from '../core/ai/status';
import { useEffect } from 'react';
import { fetchCloudConfig, type CloudConfig } from '../core/ai/geminiCloud';
import { Segmented, SectionTitle } from './parts';
import ModelCard from '../components/ModelCard';

export default function AiModel() {
  const mode = useBlueStore((s) => s.settings.modelMode);
  const update = useBlueStore((s) => s.updateSettings);
  const [tick, setTick] = useState(0);
  const status = useModelStatus(tick);
  const [cfg, setCfg] = useState<CloudConfig | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCloudConfig().then(setCfg);
    import('../core/ai/localGemma').then((m) => m.savedModelName().then(setSaved));
  }, [tick]);

  const run = async (fn: (m: typeof import('../core/ai/localGemma')) => Promise<void>) => {
    setMsg(null);
    setProgress(0);
    try {
      await fn(await import('../core/ai/localGemma'));
      setTick((t) => t + 1);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setProgress(null);
    }
  };

  return (
    <div>
      <SectionTitle title="AI Model" hint="Choose where Blue's thinking happens." />
      <Segmented
        label="Model mode"
        value={mode}
        onChange={(v) => update({ modelMode: v })}
        options={[{ value: 'local', label: 'Local (Gemma)' }, { value: 'cloud', label: 'Cloud (Gemini)' }]}
      />
      <div className="mt-4"><ModelCard /></div>

      {mode === 'cloud' && (
        <div className="mt-5 rounded-xl border border-slate-200 p-4 text-sm">
          <p className="font-medium text-ink">Gemini API: used only while Cloud is selected</p>
          <p className="text-muted mt-1">Model: <code className="rounded bg-slate-100 px-1.5 py-0.5">{cfg?.model ?? 'not configured'}</code> (set on the server, read-only)</p>
          <p className="text-muted mt-1">Raw messages, secrets and code are filtered before anything is sent.</p>
        </div>
      )}

      {mode === 'local' && (
        <div className="mt-5 rounded-xl border border-slate-200 p-4 text-sm space-y-3">
          <p className="font-medium text-ink">Local model file (experimental, needs WebGPU)</p>
          <p className="text-muted">
            Supported: <code>gemma-4-E2B-it-web.litertlm</code> (~2 GB) or <code>gemma-4-E4B-it-web.litertlm</code>. Saved once in private browser storage.
            {saved ? <> Saved: <strong>{saved}</strong>.</> : null}
          </p>
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept=".litertlm" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) run((m) => m.saveModelFile(f, setProgress)); }} />
            <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100">
              <Upload size={14} /> Choose model file
            </button>
            <button onClick={() => run((m) => m.downloadModel('gemma-4-E2B-it-web.litertlm', setProgress))} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100">
              <Download size={14} /> Download E2B from Hugging Face
            </button>
            {saved && (
              <button onClick={() => run((m) => m.removeSavedModel())} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-100">
                <Trash2 size={14} /> Remove
              </button>
            )}
          </div>
          {progress !== null && (
            <div role="progressbar" aria-valuenow={Math.round(progress * 100)} className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          )}
          {msg && <p className="text-rose-500">{msg}</p>}
          {status.state === 'unavailable' && <p className="text-amber-600">{status.reason}</p>}
        </div>
      )}
    </div>
  );
}
