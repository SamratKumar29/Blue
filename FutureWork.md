# Future Work: Blue

What is left to do, Blue's current limitations, and the upgrades that would make it truly useful day to day.

---

## 1. Pending before submission

- [ ] **Fix the 34 MB WebAssembly runtime file on Cloud Run.** `/litert-wasm/litertlm_wasm_asyncify_internal.wasm` (and its `compat` twin) returns HTTP 500 on the deployed URL. The likely cause is Cloud Run's 32 MiB limit on non-streamed responses. The 22 MB variants load fine. Fix: serve files over 30 MB chunked (streamed, without `Content-Length`), or enable HTTP/2 end to end. Then redeploy.
- [ ] **Verify Local Gemma end to end on real WebGPU** (plan step S4.6). In Chrome or Edge on the live URL: Settings > AI Model > Download E2B (about 2.0 GB), or choose a `.litertlm` file. Switch to Local, then ask a question in Chat. Record the browser, GPU, load time and a sample reply. If this cannot be done before submission, describe local mode as "experimental" in the deck and video.
- [ ] Browser smoke test of cloud mode on the live URL (S4.5, S7.5): Permission Center, roundup, triage, Why? popover, Ask a Senior with approval, blocked write, Privacy panel, Clear my Blue.
- [ ] Create the Google OAuth client and set `GOOGLE_OAUTH_CLIENT_ID` on Cloud Run (see README), add test users, then redeploy.

---

## 2. Current limitations

### Data and connectors
- **Gmail and Calendar are read-only and limited.** Real Google sign-in shows the last 48 hours of mail (sender, subject, preview text), mail search, and the next 14 days of events. Full email bodies are not read. The Google app is in "testing" mode, so only listed test users can sign in until Google verifies the app. Sign-in lasts for the tab only.
- **Slack is not connected.** It is shown as "Coming soon". Slack-like items in the demo workspace are fictional.
- **Sending is simulated.** Approved messages and meetings go to a local "Outbox (demo)". Nothing is actually sent or scheduled.
- **The senior's side is simulated.** The Ask a Senior flow (accept, calendar check, scheduling) is scripted on the user's own device. No second person or second Blue is involved.
- **Search is keyword-based.** Blue searches the bundled policy documents and the user's uploaded text files (.txt, .md, .csv) by keyword. PDFs, Word files and images are stored but not read. There are no embeddings.

### AI models
- **Local Gemma is unverified.** The download and file-picker flows exist, but no one has generated a reply on real WebGPU. The model download is large (2 to 3 GB), and on the deployed site one runtime file fails (see section 1).
- **The local model needs WebGPU.** Without it, Blue uses cloud Gemini or the offline demo.
- **Silent fallback to the offline demo.** If no model is reachable (Local selected without a model file, server unreachable, or cloud consent declined), Blue switches to a deterministic demo model. A banner says so, but the demo model can only answer a few scripted questions.
- **Cloud mode sends data to Google Cloud.** Selected, redacted content goes to Gemini on Vertex AI. This is clearly labelled and needs consent, but it is not local-first.
- **The model is pinned to `gemini-3.8-flash` on the `global` endpoint.** It is not available in the Asian regions (asia-southeast1 and asia-south1 return 404).

### Platform and UX
- **Web app only.** The sidebar and bubble live inside a browser tab. There is no OS-level desktop bubble, no system tray, and Blue is only active while the tab is open.
- **No accounts and no multi-device use.** Memory is encrypted per browser profile. Clearing browser data, or switching browser or device, means starting over. There is no backup or sync.
- **English only.**
- **No native notifications.** Reminders and check-ins appear only inside the app.
- **Accessibility gaps remain.** Lighthouse scored 96; it flagged colour contrast and one button whose visible text doesn't match its accessible label.
- **Some UI values are hardcoded,** for example the "New joiner" role label in the sidebar.

### Security and operations
- **The public endpoint isn't authenticated.** Anyone with the URL can call the Gemini endpoint. This is limited by 30 requests per minute per IP and a cap of 2 instances, but each call still costs credits.
- **The rate limiter is in memory per instance.** It resets when the server restarts and isn't shared across instances.
- **The privacy filters are pattern-based.** Secret and code-diff detection uses regexes. A new token format or a cleverly formatted snippet could slip through.
- **No CI/CD pipeline.** Deploys are manual (`gcloud run deploy --source .`).

---

## 3. Upgrades that would make Blue extremely useful

### Real connectors (highest impact)
1. **Deeper Google Workspace.** Done so far: read-only Gmail and Calendar. Next: Google app verification so anyone can sign in, Drive, opening full email threads on demand, and showing Google events in the main Calendar view.
2. **Slack and Microsoft Teams connectors.** Read-only, channel by channel, chosen by the user.
3. **Real but gated writes.** Sending a message or creating a calendar event only after the existing approval bound to the exact content. Undo window and full audit trail.
4. **Jira, Linear or Asana task import.** Pull assigned tickets into triage, so tasks are no longer only extracted from messages.

### Better intelligence
5. **Semantic search over the user's own documents.** Embeddings stored locally (or Vertex AI embeddings with consent) over approved Drive folders and wikis, with citations.
6. **Learning from the user's own history.** Better effort estimates from how long similar tasks actually took, kept in local memory only.
7. **Smarter blocker detection.** Spot tasks with no progress for N days, unanswered questions and dependency chains. Then suggest the right helper from team expertise.
8. **Meeting prep and follow-up.** Before a meeting, a one-page brief from related threads. After it, draft action items and turn them into tasks.
9. **Tuned "Ask Blue" quality.** Structured tool calls (search tasks, search policy, check calendar) instead of a single prompt, plus Gemini context caching to cut cost.

### Real-world collaboration
10. **Blue-to-Blue with consent on both sides.** One person's Blue asks a colleague's Blue for availability or a short summary. Both users approve each exchange, and every message is logged in both audit logs.
11. **A real Ask a Senior inbox.** The senior receives the request (by email, Slack, or their own Blue) and can accept, decline or propose a time.
12. **Opt-in team rituals.** Standup notes drafted from your own progress, which you edit before sharing. Still no manager dashboard and no scores.

### Platform
13. **Desktop app (Electron or Tauri).** A true floating sidebar bubble, system tray, notifications and wake/sleep tied to work hours, running even when no browser tab is open.
14. **Mobile companion / PWA.** Morning roundup and check-ins on the phone, plus push notifications.
15. **Encrypted backup and sync.** End-to-end encrypted with a key only the user holds, so memory survives a device change.
16. **Multilingual support** (Hindi, Japanese, Bahasa and others) for the JAPAC workforce.
17. **Voice.** Read the full roundup and analysis aloud, and add voice input. The first attempt only read headings, so the buttons were removed. `client/src/components/speak.ts` is kept for this.

### Trust, security and operations
18. **Sign-in and per-user quotas.** Firebase Auth or Identity Platform in front of the API, with per-user rate limits shared across instances (for example Firestore or Memorystore).
19. **Stronger privacy filtering.** Cloud DLP or an on-device classifier on top of the regexes, plus a "what will be sent" preview before every cloud call.
20. **Admin policy packs.** Organisations can tighten what Blue may read or do (for example "no cloud mode"), but can never get visibility into individuals.
21. **CI/CD.** GitHub Actions running tests, build and Lighthouse, then deploying to Cloud Run through Workload Identity Federation (no long-lived keys).
22. **Accessibility pass.** Fix the contrast and label issues and aim for Lighthouse 100 and WCAG 2.2 AA.
23. **Local model choice and performance.** Support more Gemma variants, show the download size before starting, resume interrupted downloads, and benchmark per device.
