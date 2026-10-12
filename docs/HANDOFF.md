# Handoff, 2026-10-12 (end of session 1 with Claude)

## State
Phases 0 and 1 were done earlier (Gemini). This session built Phases 2, 3 and 6 and most of 4 and 5.
- Client: `npx tsc --noEmit` and `npm run build` pass; `npx vitest run` = 37 tests pass.
- Browser smoke test (`e2e/smoke.mjs`): the first 22 checks all passed with 0 console errors.
- The extended checks (Create Task, Summarize, Write, chat, check-in, regroup, celebrate, bubble badge) were
  added to the script but the run was interrupted, so they are UNVERIFIED. Re-run them first.

## Audit of Gemini's earlier work (fixed)
- Phase 2 files existed but were unticked and not wired to the UI. The store now drives every page.
- Seed tasks faked Slack provenance before consent (broke D6). They are now clearly manual samples.
- Express 5 `app.get('*')` crash. Server rewritten.
- `docs/verified-apis.md` is WRONG about Gemma: the web build supports only `gemma-4-E2B-it-web.litertlm` and
  `gemma-4-E4B-it-web.litertlm` (not the five "-gpu" files). Its license claims are unverified. Fix that doc.
- Key race (two AES keys under StrictMode) fixed. "Clear my Blue" now destroys the key.
- Windows `Zone.Identifier` files deleted (git shows them as removed; fine to commit).
- Mascot is now a transparent cutout of the official logo (`client/public/blue.png`); moods via overlays.

## Built this session
- Server: health/config, `/api/ai/complete` (30k limit, 30 req/min, 422 on diff/secret markers, no body logs),
  Gemini wrapper (Vertex or API key). Curl-verified.
- Core: policy gate + tests, `guard()` and global ApprovalDialog (hash re-verify), encrypted store with retention,
  privacy filters, facts -> triage -> roundup pipeline, BM25 retrieval, Ask-a-Senior 6-step flow (+ busy branch),
  Write/Summarize/Create Task, grounded and tone-aware chat, capacity options, praise, check-in + focus timer,
  presence/demo clock/scheduler (one timeout while asleep), offline-demo MockProvider, lazy Local Gemma provider.
- UI: Permission Center, Home per reference, 8 Settings sections, Privacy panel + audit log, Bubble, all pages.

## Not done / blocked
1. LIVE GEMINI UNTESTED: no key and no gcloud login. Put `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-3.8-flash`
   in `server/.env` (S4.2/S4.5 verify), then do one cloud run of the full flow (Phase 5 gate).
2. Local Gemma is unverified on real WebGPU hardware. Code and the honest fallback exist.
3. Need the GCP project ID for Phase 7 (Dockerfile, IAM, deploy). Docker is on Windows only.
4. Phase 8: Lighthouse a11y score (none was ever recorded), error/empty-state pass, UX polish, rehearsal.
5. Phase 9: README, architecture diagram, deck PDF, video, submission text, public repo.
6. plan.md NOT updated. After re-verifying: tick S2.1-S2.5, S3.1-S3.5, S4.1, S4.3, S4.4, S4.7, S5.x, S6.x;
   mark S4.2/S4.5 `[!]` (needs key); leave gates 4 and 5 open; set CURRENT POINTER; add progress-log lines.
7. Minor: dist is ~110 MB because the LiteRT wasm is copied into `client/public/litert-wasm` (gitignored).
   Headless Chromium has no emoji fonts, so screenshots show boxes; real browsers are fine.

## Running the browser test (WSL, no sudo)
Chromium needs libnspr4, libnss3, libasound2t64: `apt-get download` them, `dpkg -x` into a folder, set `LD_LIBRARY_PATH`.
Install `playwright-core` in a scratch dir, build the client, `ln -s ../client/dist server/public`, start the server on
8099, then `node e2e/smoke.mjs` (env: CHROME_PATH, BASE_URL, OUT_DIR).

## Tomorrow
Re-run smoke -> update plan.md -> get key and GCP id -> live Gemini run -> Phase 7.
