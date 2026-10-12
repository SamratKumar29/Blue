import { AiError, type CompleteArgs, type ModelProvider } from './aiTypes';

// Experimental: runs Gemma in the browser through LiteRT-LM (WebGPU). Only the
// `gemma-4-E2B-it-web.litertlm` and `gemma-4-E4B-it-web.litertlm` files are supported by @litert-lm/core.

export const LOCAL_MODEL_URLS = {
  'gemma-4-E2B-it-web.litertlm':
    'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.litertlm',
  'gemma-4-E4B-it-web.litertlm':
    'https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/main/gemma-4-E4B-it-web.litertlm',
} as const;

const OPFS_DIR = 'blue-models';
const MAX_PROMPT_CHARS = 12_000;

type Engine = {
  createConversation(c?: unknown): Promise<{
    sendMessage(m: unknown): Promise<{ content: Array<{ type: string; text?: string }> }>;
    delete(): Promise<void>;
  }>;
  delete(): Promise<void>;
};

let engine: Engine | null = null;
let loading: Promise<Engine> | null = null;

async function opfsDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(OPFS_DIR, { create: true });
}

export async function savedModelName(): Promise<string | null> {
  try {
    const dir = await opfsDir();
    for await (const [name] of (dir as unknown as { entries(): AsyncIterable<[string, unknown]> }).entries()) return name;
  } catch {
    /* OPFS unavailable */
  }
  return null;
}

export async function removeSavedModel(): Promise<void> {
  const root = await navigator.storage.getDirectory();
  await root.removeEntry(OPFS_DIR, { recursive: true }).catch(() => undefined);
  await unloadLocalModel();
}

async function saveStream(name: string, stream: ReadableStream<Uint8Array>, total: number, onProgress?: (p: number) => void) {
  const dir = await opfsDir();
  const handle = await dir.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  let done = 0;
  const reader = stream.getReader();
  try {
    for (;;) {
      const { value, done: finished } = await reader.read();
      if (finished) break;
      await writable.write(value as unknown as Blob);
      done += value.byteLength;
      if (total) onProgress?.(Math.min(1, done / total));
    }
    await writable.close();
  } catch (e) {
    await writable.abort().catch(() => undefined);
    throw e;
  }
}

/** Save a user-chosen .litertlm file into private browser storage (OPFS) so it loads only once. */
export async function saveModelFile(file: File, onProgress?: (p: number) => void): Promise<void> {
  await removeSavedModel();
  await saveStream(file.name, file.stream(), file.size, onProgress);
}

/** Optional: download a supported model from Hugging Face into OPFS. */
export async function downloadModel(name: keyof typeof LOCAL_MODEL_URLS, onProgress?: (p: number) => void): Promise<void> {
  const res = await fetch(LOCAL_MODEL_URLS[name]);
  if (!res.ok || !res.body) throw new AiError('unavailable', 'Could not download the model. Choose a file instead.');
  await removeSavedModel();
  await saveStream(name, res.body, Number(res.headers.get('content-length')) || 0, onProgress);
}

export async function unloadLocalModel(): Promise<void> {
  const e = engine;
  engine = null;
  loading = null;
  await e?.delete().catch(() => undefined);
}

async function loadEngine(): Promise<Engine> {
  if (engine) return engine;
  if (!loading) {
    loading = (async () => {
      const dir = await opfsDir();
      let file: File | null = null;
      for await (const [, h] of (dir as unknown as { entries(): AsyncIterable<[string, FileSystemHandle]> }).entries()) {
        if (h.kind === 'file') file = await (h as FileSystemFileHandle).getFile();
      }
      if (!file) throw new AiError('unavailable', 'No local model file yet. Choose one in Settings > AI Model.');
      const lm = await import('@litert-lm/core');
      await lm.loadLiteRtLm('/litert-wasm/').catch((e: Error) => {
        if (!/already loading/i.test(e.message)) throw e;
      });
      const created = await lm.Engine.create({ model: file, mainExecutorSettings: { maxNumTokens: 4096 } });
      engine = created as unknown as Engine;
      return engine;
    })().catch((e) => {
      loading = null;
      throw e;
    });
  }
  return loading;
}

export class LocalGemmaProvider implements ModelProvider {
  id = 'local-gemma' as const;
  label = 'Gemma (Local)';
  dataLeavesDevice = false;

  async isAvailable(): Promise<{ ok: boolean; reason?: string }> {
    const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<unknown | null> } }).gpu;
    if (!gpu) return { ok: false, reason: 'Local model not available on this browser (WebGPU is required).' };
    try {
      if (!(await gpu.requestAdapter())) return { ok: false, reason: 'Local model not available on this device (no WebGPU adapter).' };
    } catch {
      return { ok: false, reason: 'Local model not available on this device.' };
    }
    if (!navigator.storage?.getDirectory) return { ok: false, reason: 'Local model not available (browser storage unsupported).' };
    if (!(await savedModelName())) return { ok: false, reason: 'No local model file yet. Choose one in Settings > AI Model.' };
    return { ok: true };
  }

  async complete({ system, prompt }: CompleteArgs): Promise<string> {
    if (system.length + prompt.length > MAX_PROMPT_CHARS) throw new AiError('invalid', 'Input is too long for the local model.');
    const status = await this.isAvailable();
    if (!status.ok) throw new AiError('unavailable', status.reason ?? 'Local model not available on this device/browser');
    const eng = await loadEngine();
    const convo = await eng.createConversation({ preface: { messages: [{ role: 'system', content: system }] } });
    try {
      const reply = await convo.sendMessage(prompt);
      return reply.content.filter((c) => c.type === 'text').map((c) => c.text ?? '').join('');
    } finally {
      await convo.delete().catch(() => undefined);
    }
  }
}

export const localGemma = new LocalGemmaProvider();
