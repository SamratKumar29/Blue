// Self-host the LiteRT-LM wasm so Local mode never contacts a CDN.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
const src = 'node_modules/@litert-lm/core/wasm';
const dest = 'public/litert-wasm';
if (!existsSync(src)) { console.warn('litert wasm not found, skipping'); process.exit(0); }
if (!existsSync(dest)) { mkdirSync(dest, { recursive: true }); cpSync(src, dest, { recursive: true }); console.log('copied litert wasm'); }
