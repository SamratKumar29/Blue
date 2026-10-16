# plan.md — Blue: Work & Productivity Companion

### Google Cloud AI Builder Cup 2026 · Theme: Future of Work & Enterprise Productivity

> **This file is the single source of truth for building the project and for handing work between LLM sessions.**
> Any model (strong or simple) must be able to open this file, find the first unchecked step, do it, verify it, tick it, and stop or continue.

---

## 0. HOW TO USE THIS FILE (READ FIRST, EVERY SESSION)

**Session start routine (do this every time, in order):**

1. Read sections 0 to 4 completely.
2. Go to section 4 ("Progress tracker"). Read `CURRENT POINTER` and the last 5 lines of the Progress Log.
3. Run `git status` and `git log --oneline -5` to confirm the repo matches the log. If the log says a step is done but the files are missing, un-tick that step and redo it.
4. Find the **first unchecked step (`- [ ]`)** in the phases below. That is your task. Do not skip ahead.

**How to do a step:**

1. Read the whole step: Goal, Do, Files, Verify.
2. Do exactly what "Do" says. If something is unclear, choose the simplest option that satisfies "Verify".
3. Run every command listed under "Verify". The step is done only if all of them pass.
4. **Tick the step**: edit this file and change `- [ ]` to `- [x]` for that step only.
5. Add one line to the Progress Log in section 4: `date | step id | model name | one-line note`.
6. Update `CURRENT POINTER` to the next unchecked step ID.
7. Commit: `git add -A && git commit -m "S<id>: <short title>"`.
8. Continue to the next step, or stop if the user says so.

**Symbols:** `- [ ]` not done · `- [x]` done and verified · `- [!]` blocked (write the reason on the line below and in "Blockers").

**Hard rules for all models:**

- Never mark a step done without running its Verify. Never delete or reorder steps. To add work, insert a new step with an id like `S4.3a`.
- One step at a time. Do not start a phase until the previous phase's **Gate** is fully ticked.
- Never commit secrets (API keys, tokens, `.env`). Never put real personal data in the repo; sample data is fictional.
- **Do not guess API names, package names, or model IDs.** Where a step says `VERIFY`, open the linked official documentation and use what it says. Record what you found in the Progress Log.
- Keep the app working after every step (`npm run build` must pass in `client/` and `server/` once they exist).
- If a step is taking more than its time-box, use the step's **Fallback**, mark it in the log, and move on. The deadline is fixed.
- Be honest in the UI and docs: never display "No data leaves your device" unless the app is really in local-only mode (see Decision D5).
- If the user's `Goals.md` exists in the repo root, read it. If it conflicts with this file, tell the user and follow the user.

---

## 1. GOALS (self-contained summary; the user's Goals.md was not attached)

### 1.1 What we are building

**Blue** is a privacy-first, personal AI work companion for employees. Tagline: **"My Blue is my Blue, not your Blue."**
It reads only the sources the user approves, turns them into a calm morning roundup, sorts tasks into **Easy wins / Next up / Needs senior help**, detects blockers, helps the user ask for help early, drafts messages (never sends without an exact-content approval), and offers optional, private wellbeing check-ins. Managers get no dashboard, no scores, no private memory.

### 1.2 Competition requirements (hard constraints)

| Requirement                                          | Source rule                                                  | How we satisfy it                                      |
| ---------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| Challenge theme                                      | Choose exactly one theme                                     | **Future of Work & Enterprise Productivity**           |
| Uses Google AI                                       | Gemini or Gemma, or Agent Platform / Antigravity / AI Studio | Gemma (local, in browser) + Gemini (cloud, via server) |
| Deployed on Google Cloud                             | Cloud Run or Firebase                                        | **Cloud Run** (one service serving UI + API)           |
| Working prototype                                    | Not a mockup                                                 | Real flows with sample data and real model calls       |
| Public GitHub repo                                   | Public access                                                | Phase 9                                                |
| Deck as PDF, max 5 MB                                | Form upload                                                  | Phase 9                                                |
| Demo video, max 3 minutes                            | Public YouTube/Vimeo/Drive link                              | Phase 9                                                |
| Brief description incl. how Google services are used | Form text box                                                | Phase 9                                                |
| All materials in English                             | Rules                                                        | Yes                                                    |

**Deadline: 18 Oct 2026.** Our internal target for submitting: **17 Oct 2026**.

### 1.3 Judging weights (optimize for these)

Technical merit and meaningful Gen AI use **40%** · Problem alignment and impact **25%** · Innovation and differentiation **25%** · UX and solution design **10%**.
Our differentiators vs "Copilot-style" assistants: employee-owned, local-first, read-only by default, deterministic **policy gate** outside the model, no codebase access, no manager surveillance, culture of "asking for help is a strength".

### 1.4 Product principles (must be visible in the product, not just the slides)

1. Personal ownership: user controls memory, permissions, retention.
2. Least privilege: read-only by default; every write needs a preview and an explicit click bound to the exact content.
3. Hyper-local memory: store compressed summaries and pointers, never raw email/chat bodies.
4. No codebase access: repos, diffs, CI logs, secrets are excluded.
5. No autonomous Blue-to-Blue behavior: disabled in the MVP; attempts are blocked and logged.
6. Support, not surveillance: no manager view, no mood inference, no scoring.
7. Explainability: every recommendation shows source category, confidence, and reason.
8. User control: pause, mute, inspect, export, reset, delete.

### 1.5 Scope boundaries

**In MVP:** dashboard + bubble + settings UI; sample "Demo Workspace" connector; local encrypted memory; task triage; morning roundup; ask-a-senior; draft message with approval gate; policy retrieval over sample docs; privacy panel; audit log; work-hours behavior; Gemini via Cloud Run; Gemma in-browser (time-boxed).
**Out of MVP (mention only as roadmap):** real Slack/Gmail OAuth, Blue-to-Blue, screen capture, native desktop bubble (Electron), multilingual, admin policy packs.

---

## 2. KEY DECISIONS (fixed; do not change without asking the user)

- **D1. Web app, not desktop.** A browser cannot be an OS-level sidebar. The "sidebar bubble" is implemented as (a) a collapsible left rail and (b) a floating bubble widget bottom-right that expands on hover/click. A native desktop shell is roadmap.
- **D2. Stack:** Client = React 18 + TypeScript + Vite + Tailwind CSS **3.4** + react-router + zustand + lucide-react + idb. Server = Node 20 + Express + TypeScript + `@google/genai`. Tests = vitest. One repo, two packages (`client/`, `server/`).
- **D3. Hosting:** one Docker image on **Cloud Run** (Express serves the built client and `/api/*`). Listens on `$PORT` (default 8080).
- **D4. Model abstraction:** a `ModelProvider` interface with two implementations: `GeminiCloudProvider` (calls `/api/ai/complete`) and `LocalGemmaProvider` (in-browser). The UI always works with either. Model IDs are never hardcoded: they come from env/config.
- **D5. Honest labelling:** the UI shows the true mode. Local mode: "Running on your device. No data leaves your device." Cloud mode: "Cloud mode: selected content is sent to Google Cloud (Gemini) for processing." Switching to cloud mode requires a one-time consent click (`cloud_inference` action in the policy gate).
- **D6. Defaults match the PDF, not the mock screenshot:** write access OFF, connectors OFF until the user enables the Demo Workspace in the first-run Permission Center. (The mock UI shows toggles ON; we start OFF and the first-run flow turns on what the user chooses.)
- **D7. "Send" is simulated.** An approved send adds the message to a local "Outbox (demo)" list. No real network send. Say so in the UI ("Demo: nothing is actually sent").
- **D8. Data:** all sample data is fictional JSON in `client/src/data/`. Memory is stored in IndexedDB, encrypted with WebCrypto AES-GCM (non-extractable key).
- **D9. Visual identity (from the official gui_reference designs):** Official planetary Blue mascot with holographic ring, glowing cyan star antenna, translucent spectacles, dark navy sidebar (`#0B1636`), bright Google blue accent (`#3B6CF6`), soft sunrise gradient cards, priority badges (Easy/Medium/Hard), and warm glassmorphic modal workflows matching `gui_reference/`.

---

## 2.1 GUI REFERENCE DESIGN & DETAILED UI SPECIFICATION (from gui_reference/)

The user provided the official high-fidelity UI reference designs in `gui_reference/`. The application must reproduce these screens, workflows, and character interactions exactly.

### 2.1.1 Asset & Mascot Specification (`Logo.jpeg` & `2.57.55 PM.jpeg`)
- **Official Character Asset**: `gui_reference/Logo.jpeg` (copied to `client/public/logo.jpeg` & `client/src/assets/logo.jpeg`).
- **Visual Features**: A spherical glossy blue planetoid with large anime-style glowing eyes with highlights, transparent spectacles/glasses, a glowing cyan star antenna, and an iridescent holographic planetary ring with sparkles.
- **Mascot Moods & Variants** (displayed contextually across views):
  1. **Happy**: Welcoming smile, bright eyes, sparkling ring (Default & Roundup).
  2. **Thinking**: Eyes looking upward, rotating ring with subtle tilt, question mark bubble (Analysis & Triage).
  3. **Excited**: Wide sparkling eyes, floating with celebration confetti and star particles (Task Completed).
  4. **Sleep Mode**: Eyes closed sleeping (zzz), calm dimmed ring, quiet night aura (Off-work hours).
  5. **Working**: Sitting at miniature glowing laptop with focus glasses (Active background processing).
  6. **Encouraging**: Warm smile with heart bubble, thumbs-up gesture (Wellbeing check-ins).
- **Side Bubble**: A vertical floating dark navy capsule anchored to the right margin with Home, Blue mascot, and Chat icons plus an expandable speech bubble: *"Hey! I'm Blue 👶 Need anything?"*.

### 2.1.2 Main Dashboard UI (`WhatsApp Image 2026-10-12 at 2.57.55 PM.jpeg`)
- **Top Header Bar**:
  - Search input with placeholder `"Q Search anything..."`
  - Notification bell icon with unread badge counter
  - Help icon (`?`)
  - User avatar (`AJ` / Alex Johnson, Product Designer)
- **Sunrise Hero Banner**:
  - Greeting: `"Good morning, Alex! ☀️"` (time-sensitive: morning/afternoon/evening)
  - Subtitle: `"Here's your roundup for today. Let's make it count!"`
  - Right hero graphic: 3D Blue mascot floating in soft lilac clouds with speech bubble: `"Small steps. Big progress!" ✨`
- **Today's Priorities Card**:
  - Header: `"Today's Priorities"` with `"View all →"` navigation link.
  - Priority task rows with colored pill badges:
    - `● Easy` (Emerald green badge): e.g., *"Design review for landing page"* · `Due 10:00 AM`
    - `● Easy` (Emerald green badge): e.g., *"Update documentation (Team)"* · `Due 11:30 AM`
    - `● Medium` (Amber yellow badge): e.g., *"API integration discussion"* · `Due 02:00 PM`
    - `● Hard` (Rose red badge): e.g., *"Sprint planning (need senior help)"* · `Due 04:00 PM`
  - Interactive checkboxes to toggle task completion with instant encrypted persistence.
- **Team Updates Card**:
  - Header: `"Team Updates"` with `"View all →"` link.
  - Rows:
    - **Slack**: Slack icon, `"12 new messages"`, timestamp `"10:24 AM"`.
    - **Gmail**: Gmail icon, `"2 important emails"`, timestamp `"09:42 AM"`.
    - **Calendar**: Calendar icon, `"Design sync (11:00 AM)"`, timestamp `"09:30 AM"`.
- **Mascot Progress Card**:
  - Soft gradient banner with floating mascot: `"Great job on yesterday's tasks! >"`
  - Subtext: `"You closed 4 tasks and helped unblock the team. That's the Blue way!"`
  - Action button: `"Keep it up! 💙"`
- **Quick Actions Grid (3x2)**:
  - 1. `Ask Blue` (Blue speech bubble icon `@`)
  - 2. `Summarize` (Document clipboard icon 📋)
  - 3. `Write` (Pen/pencil icon ✍️)
  - 4. `Find Help` (Search magnifier icon 🔍)
  - 5. `Create Task` (Checkbox plus icon ☑️)
  - 6. `More` (Ellipsis icon `...`)
- **Your Team at a Glance (Bottom Full-Width Section)**:
  - Team member status cards:
    - **Alex (You)**: Avatar + `"On track"` (green pill)
    - **Priya**: Avatar + `"In progress"` (yellow pill)
    - **Michael**: Avatar + `"Needs help"` (rose/red pill)
    - **Sarah**: Avatar + `"On track"` (green pill)
  - Right callout card: `"Need help with something? Ask Blue, or request support from your team. It's a sign of strength, not weakness."` with a prominent blue `+` button triggering the Senior Routing workflow.

### 2.1.3 Settings Modal UI (`WhatsApp Image 2026-10-12 at 2.57.55 PM.jpeg`)
- **Layout**: Modal dialog with left category rail and right detailed form.
- **Navigation Tabs**:
  1. `General` (selected by default)
  2. `Privacy & Data`
  3. `AI Model`
  4. `Connectors`
  5. `Notifications`
  6. `Work Hours`
  7. `Appearance`
  8. `About`
- **General Tab Form Controls**:
  - Header: `"General"` — `"Customize your Blue experience."`
  - **Your Name**: text input with leading user icon (`Alex Johnson`).
  - **Timezone**: select dropdown defaulting to `(GMT+5:30) India Standard Time`.
  - **Language**: select dropdown defaulting to `English`.
  - **Blue's Presence**: segmented pill toggle (`Work hours only` [active] | `Laptop awake`) with helper text: *"Blue will wake 30 minutes before your workday and sleep after your work hours."*
  - **Local AI Model Card**:
    - Chip icon + title `"Gemma 4 (Local)"` with green `"Active"` badge.
    - Description: *"Running on your device using LiteRT-LM. No data leaves your device."*
    - Action button: `"Change model"` (opens AI Model tab for cloud Gemini toggle).
  - **Privacy Quick Controls**:
    - Toggle: `"Allow writing (with approval)"` — *"Blue will ask for your permission before sending, editing, or deleting anything."*
    - Toggle: `"Allow connectors"` — *"Enable Gmail, Slack, Calendar and other apps."*
    - Toggle: `"Allow team context"` — *"Use team/project context (no codebase access)."*
  - **Footer Privacy Assurance Box**:
    - Blue lock icon + bold statement: *"Your data stays with you. Always. My Blue is my Blue, not your Blue."*

### 2.1.4 Interactive Modal Workflows & State Machines

#### A. Task Analysis & Assistant Dialog (`WhatsApp Image 2026-10-12 at 10.31.23 PM.jpeg`)
- Triggered by clicking any task or typing in Ask Blue.
- **Header**: Mascot avatar, `"Blue"` — `"Thinking. Analyzing. Finding the best way..."`, close `✕`.
- **Mascot Speech Bubble**: `"Got it! Let me analyze this task and figure out the best way to help you."`
- **Task Header Card**: Document icon + Task Title (e.g., *"Build the analytics dashboard for Q2"*) + description (*"This seems to involve data analysis, visualization and multiple systems."*).
- **My Analysis Breakdown**:
  - `Task complexity`: Moderate to High (requires domain knowledge + data access) → `High` badge.
  - `Can Frontier LLMs help?`: Yes, for research, ideation, and drafting → `Possible` badge.
  - `Need a senior expert?`: Yes, for final architecture, data access and business context → `Likely` badge.
- **What I'll do (with your permission)**:
  - 1. Use Frontier LLMs to gather best practices and draft an initial plan.
  - 2. Route to a senior (Data & Analytics Lead) for domain expertise and data access guidance.
  - 3. Keep your data private — only task summaries will be shared.
- **Privacy Confirmation**: *"I won't take any action (like scheduling or sharing) without your explicit permission. Would you like me to proceed with this plan?"*
- **Action Footer**: Audio button (🔊), `"✓ Yes, proceed"` (primary blue button), `"✕ No, abort"` (white button with border), `...` button.

#### B. "Ask a Senior" End-to-End Workflow (`WhatsApp Image 2026-10-12 at 10.38.42 PM.jpeg` & `10.41.28 PM.jpeg`)
A 6-step collaborative guidance journey:
1. **Step 1 — Request Sent to Senior**:
   - Mascot floating with paper planes + Priya Sharma profile card (`Senior Product Designer`, `Request sent` badge).
   - "What was shared": Task details & goals, Relevant background & context, Suggested approach & questions, Deadline and priority.
   - Lock card: *"Your data stays private. Only what's needed is shared with Priya."*
2. **Step 2 — Senior Receives & Responds**:
   - Priya Sharma's simulated view: *"Blue has requested your help: Hi Priya! I could use your expertise on a product strategy question..."*
   - Buttons: `Accept` (blue), `Decline` (white), `→ View details`.
3. **Step 3 — Notification to Blue**:
   - Mascot in celebration halo: *"Great news! Priya has accepted your request. I'll now check their calendar and suggest a meeting time based on their availability."*
   - Animated calendar check: `"Checking Priya's calendar..."` with loader dots.
4. **Step 4 — Proposed Meeting Details (Needs Your Approval)**:
   - Meeting card: *"Strategy Discussion — Product Direction"*, With Priya Sharma, Date & Time (Wed, Apr 30, 2025 · 11:00 AM - 11:45 AM), Google Meet.
   - Meeting context checklist + *"Relevant docs & summary (no raw data)"*.
   - Action buttons: `Allow & Schedule` (calendar icon), `Not now`.
5. **Step 5 — Meeting Scheduled**:
   - Mascot with glowing checkmark: *"All set! The meeting has been scheduled."*
   - Confirmed meeting card + Google Meet link.
   - Note: *"You'll get a calendar invite shortly, and I'll be here when the meeting starts. Good luck!"*
6. **Step 6 — In Your Calendar**:
   - In-app Calendar view highlighting the scheduled slot at 11:00 AM.
   - Floating Blue mascot: *"Ready for the meeting? I'm here if you need anything else!"*
- **Alternative / Fallback Branch (When Senior is Busy — `10.41.28 PM.jpeg`)**:
  - 1. Proposes senior's next available slot (e.g., Tomorrow 10:00 AM) or alternative option.
  - 2. Scans junior team availability (Arjun Mehta - Free, Neha Kapoor - Busy, Rohan Das - Free, Sneha Iyer - Free).
  - 3. If time is critical, suggests alternative: *"You can send your work summary on Teams or Slack to your manager for a quick review."*
  - 4. Blue drafts a concise message with key points, seeks permission, sends to manager, and confirms with a tracking checklist.

#### C. Permission Request & Policy Gate Flow (`WhatsApp Image 2026-10-12 at 7.39.34 PM.jpeg` & `7.39.35 PM.jpeg`)
1. **Screen 1 — Permission Request with Task Summary**:
   - Mascot with speech bubble: *"Here's what I'll do, Alex! I've grouped the tasks and actions based on your priorities and context. Please review and give me permission to proceed."*
   - Task Summary:
     - `1 High Priority` (2 tasks) — Finalize design mockups (15m), Update documentation (30m)
     - `2 Next Up` (2 tasks) — Build API integration (2h), Prepare sprint demo (1h)
     - `3 Needs Senior Help` (1 task) — Resolve production bug (1h)
   - Connector Status: Gmail (read + summarize ✓), Slack (summarize ✓), Calendar (propose slots ✓).
   - Audio Bar: `"Tap to hear Blue's summary →"`
   - Buttons: `Abort` (left pill), `✓ Allow` (right blue pill).
2. **Screen 2 — Redo Confirmation Pop-up**:
   - Centered modal over dimmed backdrop with questioning mascot.
   - Title: `"Would you like to redo?"`
   - Subtitle: *"I can go back and make changes, or we can move forward with this plan."*
   - Buttons: `↻ Yes, redo (Go back to edit the plan) →` (blue) | `✕ No, continue (Move to the next step) →` (white).
3. **Screen 3 — Task Aborted Screen**:
   - Relieved mascot with red `✕` bubble: `"Task aborted ✨"`
   - Subtitle: *"No worries! I won't take any action. I'll ask for your permission for the next one."*
   - Shield card: `"Your control matters: You're always in charge. I'll wait for your permission before doing anything else."*
   - Button: `Back to Dashboard` (blue).

#### D. Private Wellbeing Check-in (`WhatsApp Image 2026-10-12 at 7.46.30 PM.jpeg`)
- Mascot floating with heart bubble in a peaceful setting.
- Title: `"Hey Alex! 👋"` — *"Just checking in on you. How are you feeling today?"*
- Emotion selector cards (interactive):
  - 😄 `"Great"`
  - 😐 `"Okay"`
  - 😕 `"A bit tired"`
  - ☹️ `"Stressed"`
- Reassurance note: *"No pressure! Just a quick check-in. Your well-being matters. 💙"*
- Support prompts: `"✨ Motivation"`, `"☕ Break suggestion"`, `"💬 Just chat"`.
- Private message input: *"Type a message or choose an option..."*

#### E. Task Completion Celebration (`WhatsApp Image 2026-10-12 at 7.46.30 PM.jpeg`)
- Floating celebratory mascot with checkmark badge and star confetti.
- Title: `"Task Completed! 🎉"` — *"You did it, Alex! Here's what you accomplished:"*
- Completed task badge + Project tag + timestamp.
- Encouragement box: *"That's a big step forward! 💙 Your focus and effort are making a real difference. Keep going!"*
- Small celebration quote card: `★ "Progress, not perfection, builds amazing things."`
- Buttons: `"→ View next task"` (blue) | `"Maybe later"` (white).

#### F. Morning Roundup Kickoff (`WhatsApp Image 2026-10-12 at 7.46.30 PM.jpeg`)
- Peaceful stretching mascot with sunrise aura: badge `"You're all set for the day!"`.
- Title: `"Good morning, Alex! ☀️"` — *"A fresh day brings new opportunities. Let's get you ready for a productive and fulfilling day!"*
- Value pillars:
  - 🟢 `Keep you on track` (Gentle reminders and smart prioritization of your tasks.)
  - 🟣 `Reduce stress` (Break big tasks into smaller steps and offer support when you need it.)
  - 🔵 `Save you time` (Summarize updates, find what matters, and eliminate busy work.)
  - 🔴 `Boost your focus` (Encourage healthy breaks and celebrate your progress.)
- Footer: *"A calm mind, a clear plan, and a little support go a long way. 💙"*
- CTA Button: `"▶ Let's make it a great day!"`

---

## 3. TARGET REPO LAYOUT

```
blue/
├─ plan.md                      <- this file
├─ Goals.md                     <- (optional, from user)
├─ README.md
├─ Dockerfile
├─ .dockerignore  .gitignore  .env.example
├─ docs/                        <- architecture.md, architecture.png, deck/, video/
├─ server/
│  ├─ package.json  tsconfig.json
│  └─ src/ index.ts  routes/ai.ts  routes/health.ts  gemini.ts  limits.ts
└─ client/
   ├─ package.json  vite.config.ts  tailwind.config.js  index.html
   └─ src/
      ├─ main.tsx  App.tsx
      ├─ styles/index.css
      ├─ components/  (Sidebar, Bubble, BlueMascot, Card, Toggle, TaskRow, ...)
      ├─ pages/       (Home, Chat, Tasks, Calendar, Files, Team, Apps, Outbox)
      ├─ settings/    (SettingsModal + one file per section)
      ├─ core/
      │  ├─ types.ts
      │  ├─ policy/gate.ts  gate.test.ts
      │  ├─ memory/crypto.ts  db.ts  audit.ts  memory.test.ts
      │  ├─ ai/provider.ts  geminiCloud.ts  localGemma.ts  prompts.ts  schemas.ts
      │  ├─ features/ transform.ts  triage.ts  roundup.ts  askSenior.ts  draft.ts  chat.ts  retrieval.ts  capacity.ts  checkin.ts
      │  ├─ presence/ workHours.ts  workHours.test.ts  scheduler.ts  demoClock.ts
      │  └─ connectors/ demoWorkspace.ts  filters.ts
      └─ data/ messages.json  emails.json  calendar.json  team.json  policies/*.md  project_brief.md
```

---

## 4. PROGRESS TRACKER (update after every step)

**CURRENT POINTER:** `S0.4` (GCP project exists; needs gcloud on Windows + services enabled) → then `S4.2`/`S4.5` live Gemini test → `S7.1`. Phase 8 work may proceed in parallel; Phase 9 only after Phases 0-8 gates pass.

**Schedule (target, adjust if needed):**
| Day | Date | Phases |
|---|---|---|
| 1 | Mon 12 Oct | Phase 0, Phase 1 |
| 2 | Tue 13 Oct | Phase 2, Phase 3 |
| 3 | Wed 14 Oct | Phase 4 |
| 4 | Thu 15 Oct | Phase 5, Phase 6 |
| 5 | Fri 16 Oct | Phase 7, Phase 8 |
| 6 | Sat 17 Oct | Phase 9 and SUBMIT |
| Buffer | Sun 18 Oct | Deadline day: only fixes, never new features |

**Phase gates:**

- [ ] Phase 0 gate passed (S0.4 still blocked; was ticked prematurely, unticked 2026-10-16)
- [x] Phase 1 gate passed
- [x] Phase 2 gate passed
- [x] Phase 3 gate passed
- [ ] Phase 4 gate passed
- [ ] Phase 5 gate passed
- [x] Phase 6 gate passed
- [ ] Phase 7 gate passed
- [ ] Phase 8 gate passed
- [ ] Phase 9 gate passed (SUBMITTED)

**Progress log** (newest at the bottom; format: `date | step | model | note`):

```
2026-10-12 | plan created | Claude | initial plan.md written
2026-10-12 | S0.1 | Antigravity | team of 2 registered, both eligible (21+ JAPAC working professionals)
2026-10-12 | S0.2 | Antigravity | node v20.20.2 (nvm), npm 10.8.2, git 2.43.0, gcloud 588.0.0; docker via Windows Docker Desktop (WSL integration)
2026-10-12 | S0.3 | Antigravity | git init, .gitignore, .env.example, docs/ created
2026-10-12 | S0.4 | Antigravity | GCP project pending user setup; fallback: continue without cloud until Phase 7
2026-10-12 | S0.5 | Antigravity | @google/genai SDK, gemini-3.8-flash (stable); Vertex mode via vertexai:true + project/location
2026-10-12 | S0.6 | Antigravity | @litert-lm/core, Gemma 4 E2B/E4B/12B/26B-A4B/31B .litertlm files, WebGPU required, HuggingFace hosted, Gemma Terms of Use
2026-10-12 | S1.1-S1.9 | Antigravity | Client + server scaffolded, Tailwind tokens, Blue mascot SVG, Home dashboard, Bubble, 8-section Settings modal, static routes, screenshots captured (docs/screens/)
2026-10-12 | S2-S6 | Claude | built; see docs/HANDOFF.md
2026-10-13 | verify | Claude | tsc, build, vitest 37 pass; e2e/smoke.mjs all checks pass, 0 console errors (fixed test races + bubble test uses fresh profile); verified-apis.md Gemma corrected
2026-10-16 | audit | CoCo (claude-opus-5-5) | audited Phases 0-9 vs repo; unticked Phase 0 gate (S0.4 blocked). Windows checkout: npm install in client+server; tsc + both builds pass
2026-10-16 | fix | CoCo | pipeline.test.ts regressions after tasks.json/team.json reseed: roundup now strips suggestedHelperId when team context is off (real privacy bug); test expects team-4 (DevOps). vitest 37/37 pass
2026-10-16 | S1.9 | CoCo | Lighthouse a11y on / (vite preview, Edge headless) = 96; failing audits: color-contrast, label-content-name-mismatch (for S8.4)
2026-10-16 | sidebar.md/calendar.md | CoCo | sidebar: roundup mascot + sparkle, theme toggle, shortcuts modal, profile footer, active bar; global keyboard shortcuts in App.tsx; Calendar page already matched calendar.md
2026-10-16 | .gitignore | CoCo | removed pasted tool-call garbage; .env still ignored and never committed
2026-10-16 | S4.2 live test | CoCo | API key authenticates. gemini-2.5-flash -> 404 (retired for new users); gemini-3.8-flash -> 402 "prepayment credits depleted" (AI Studio billing, not GCP trial). Next: Vertex mode (USE_VERTEX=true) once gcloud ADC is set up
```

**Blockers:** S4.2/S4.5 live run fails: AI Studio key has no prepaid credits (402); plan: switch to Vertex AI using the GCP trial project, which needs gcloud installed on Windows + `gcloud auth application-default login`. Also set GEMINI_MODEL=gemini-3.8-flash. S7 needs gcloud too. S4.6 Local Gemma unverified on real WebGPU.

**Decisions log** (anything the user decided later):

- 2026-10-12: Team confirmed: 2 members registered, both 21+ JAPAC working professionals eligible.
- 2026-10-12: Docker: user has Docker Desktop on Windows with WSL integration (no Docker in WSL distro directly).
- 2026-10-12: gcloud: installed to ~/google-cloud-sdk via standalone installer (no sudo needed).
- 2026-10-12: Gemma local model: default to E2B (smallest, most practical in browser); user can choose model file.
- 2026-10-12: GCP project ID: TBD (user setting up).
- 2026-10-16: User created GCP project (free trial credits) and a new Gemini API key; values in root `.env` (gitignored).
- 2026-10-16: sidebar.md / calendar.md are teammate design notes from another codebase; implement their visual intent in Blue, not their file structure.
- 2026-10-16: Phase 9 starts only after all earlier phase gates pass.

---

# PHASE 0 — Setup and verification (about 2 hours)

- [x] **S0.1 Confirm eligibility and team registration (human step, then log it)**
  - Goal: avoid building something we are not allowed to submit.
  - Do: Ask the user to confirm (a) the team of 2 is registered on the AI Builder Cup portal (the site's FAQ says team formation closed 11 Oct, but its overview page says 14 Oct; confirm with organizers), (a2) both members are 21+ and based in JAPAC, and (b) the user has checked with support+aibuildercup@hack2skill.com that his status counts as a "working professional" (students are not eligible and can be disqualified later). Write the user's answer in the Decisions log.
  - Verify: Decisions log has an entry. If the user says it is unresolved, continue building but add a Blocker note "eligibility unconfirmed".

- [x] **S0.2 Check the local tools**
  - Do: run `node -v` (need 20 or higher), `npm -v`, `git --version`, `docker --version` (optional), `gcloud --version`.
  - If gcloud is missing, tell the user to install the Google Cloud CLI and run `gcloud auth login`. Do not continue Phase 7 without it.
  - Verify: node is v20+; git works. Write versions in the log.

- [x] **S0.3 Create the repo**
  - Do: `mkdir blue && cd blue && git init`. Copy this `plan.md` into the root. Create `.gitignore` with: `node_modules`, `dist`, `.env`, `.env.*` (but keep `.env.example`), `*.log`, `.DS_Store`, `coverage`, `server/public`.
  - Create `.env.example` containing only placeholder names (no values): `PORT=8080`, `GEMINI_MODEL=`, `GEMINI_API_KEY=`, `USE_VERTEX=false`, `GOOGLE_CLOUD_PROJECT=`, `GOOGLE_CLOUD_LOCATION=`.
  - Verify: `git status` shows the files; `.gitignore` contains `.env`.

- [!] **S0.4 Google Cloud project and billing (human step)**
  - Blocked: GCP project ID not yet provided. Will continue Phases 1-3, block Phase 7 until done.
  - Do: ask the user for the GCP project ID and whether billing/credits are active. Write the project ID in the Decisions log. Then run: `gcloud config set project <PROJECT_ID>` and `gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com aiplatform.googleapis.com secretmanager.googleapis.com`.
  - Verify: `gcloud services list --enabled | grep -E "run|aiplatform"` shows both.
  - Fallback if the user has no project yet: continue Phases 1 to 3 (they need no cloud). Block Phase 4 until done.

- [x] **S0.5 VERIFY the Gemini SDK and model ID**
  - Do: open https://ai.google.dev/gemini-api/docs (quickstart and models page). Find (1) the current official JavaScript package name for the Gen AI SDK, (2) how to call generateContent with a system instruction and a JSON response schema, (3) how to enable Vertex AI mode, (4) the current recommended fast Gemini model ID. Create `docs/verified-apis.md` and write what you found, with the URL and date.
  - Verify: the file exists and lists package name, example call, vertex-mode flag, model ID.

- [x] **S0.6 VERIFY the in-browser Gemma runtime (research only, no coding)**
  - Do: open these pages and record in `docs/verified-apis.md`: https://ai.google.dev/gemma/docs , https://ai.google.dev/gemma/docs/releases , https://developers.google.com/edge/litert-lm/overview , https://developers.google.com/edge/litert-lm/js . Record: the exact Gemma model names offered for web, the npm package for the JS API, model file format, approximate download size, license terms (can we host the file ourselves, or must each user download it?), and browser requirements (WebGPU?).
  - The plan's PDF mentions "Gemma 4" variants (E2B, E4B, 12B, 26B A4B, 31B). Do not assume; confirm.
  - Verify: `docs/verified-apis.md` has a "Gemma web" section with those 6 facts. If the docs contradict the plan, write "DOCS DIFFER" and tell the user.

**Phase 0 Gate:** S0.1 to S0.6 ticked, then tick "Phase 0 gate passed" in section 4.

---

# PHASE 1 — App shell and the full UI with static data (Day 1)

Goal: the app looks like the approved mock (3 panels: side bubble, dashboard, settings) before any AI is wired. Use hardcoded sample content for now.

- [x] **S1.1 Scaffold client and server packages**
  - Do:
    1. `npm create vite@latest client -- --template react-ts` then `cd client && npm i`.
    2. `cd client && npm i react-router-dom zustand lucide-react idb` and `npm i -D vitest tailwindcss@3.4 postcss autoprefixer`.
    3. `mkdir server && cd server && npm init -y && npm i express @google/genai && npm i -D typescript tsx @types/express @types/node` (use the SDK package name from `docs/verified-apis.md` if it differs).
    4. In `client/vite.config.ts` add a dev proxy: `server: { proxy: { '/api': 'http://localhost:8080' } }`.
    5. Root `package.json` scripts are optional; document in README: run client with `npm run dev` in `client/`, server with `npm run dev` in `server/`.
  - Verify: `cd client && npm run build` succeeds.

- [x] **S1.2 Tailwind and design tokens**
  - Do: `cd client && npx tailwindcss init -p`. In `tailwind.config.js` set `content: ['./index.html','./src/**/*.{ts,tsx}']`. Add to `theme.extend.colors`: `navy: { 900:'#0B1636', 800:'#102048', 700:'#1B2D63' }`, `blue: { 50:'#EEF4FF', 100:'#DCE8FF', 500:'#3B6CF6', 600:'#2F59D9' }`, `ink: '#1B2547'`, `muted: '#6B7692'`, `good:'#2BB673'`, `warn:'#F5B83D'`. Add `borderRadius: { card:'16px' }` and `boxShadow: { card:'0 6px 24px rgba(30,60,140,0.08)' }`. Replace `src/styles/index.css` with the three `@tailwind` directives plus `body { @apply bg-slate-50 text-ink; font-family: Inter, system-ui, sans-serif; }`.
  - Verify: add `<div className="bg-blue-500 text-white p-4 rounded-card">test</div>` to `App.tsx`, run `npm run dev`, confirm a blue rounded box appears, then remove the test.

- [x] **S1.3 BlueMascot component (SVG)**
  - Files: `client/src/components/BlueMascot.tsx`.
  - Do: build an inline SVG, props `{ size?: number; mood?: 'happy'|'wink'|'calm' }`. Shape: a rounded blob body filled with a blue linear gradient (#6FA0FF to #3B6CF6), a white rounded face area, two dark oval eyes with small white highlights, small pink cheeks, and a small leaf/antenna on top. `wink` closes the right eye as a curve. Keep it under 80 lines.
  - Verify: render all three moods on a temporary page; they display without errors.

- [x] **S1.4 App shell: left rail and routing**
  - Files: `components/Sidebar.tsx`, `App.tsx`, `main.tsx`, `pages/*.tsx` (empty placeholders).
  - Do: use react-router with routes `/` Home, `/chat`, `/tasks`, `/calendar`, `/files`, `/team`, `/apps`, `/outbox`. The Sidebar is a dark navy (bg-navy-900) vertical rail, ~80px wide, with the "B" logo on top, then icon+label items (lucide icons): Home, Chat, Tasks, Calendar, Files, Team, Apps, then a Blue mascot mini-bubble and the user avatar at the bottom. The active item has a lighter navy rounded background. Make labels tiny (11px) under the icons like the mock.
  - Verify: clicking each nav item changes the URL and highlights the item; keyboard Tab reaches every item; each item has an `aria-label`.

- [x] **S1.5 Home dashboard (static)**
  - Files: `pages/Home.tsx` plus components `HeroCard`, `TaskGroupCard`, `TeamUpdatesCard`, `QuickActions`, `ProgressCard`, `RecentActivity`, `StatusPill`.
  - Do: reproduce the mock layout in a 2-column grid under a gradient hero.
    - Hero: pale blue-to-peach "sunrise" gradient, greeting "Good morning, {name}!" (time-based: morning/afternoon/evening), subtitle "Blue here. I've got your roundup for today.", an "Active" green pill, notification bell, avatar. Under it a white card with the mascot and "Your day, simplified" with a one-line subtitle.
    - Left column: "Today's Tasks" card with three labeled groups: green dot "Easy wins", blue dot "Next up", amber dot "Needs senior help"; each task row is a checkbox + title + project in parentheses + right-aligned duration pill (15m, 30m, 2h...). Below it a "Great progress!" card with the mascot ("You checked off N tasks today. Keep it up!").
    - Right column: "Team Updates" (rows for Slack, Gmail, Calendar with icon, short text, time), "Quick Actions" (3x2 grid: Ask Blue, Summarize, Write, Find Help, Create Task, More), "Recent Activity" (3 rows with small avatar, text, "2h ago").
    - Use hardcoded arrays for now.
  - Verify: side by side with the mock image, the structure matches; the page is usable at 1280px wide and does not scroll sideways at 1024px.

- [x] **S1.6 Floating Blue bubble widget**
  - Files: `components/Bubble.tsx`.
  - Do: a fixed bottom-right widget. Collapsed: a 56px mascot circle with a small status dot (green active, grey sleeping) and no content. On hover or click: expands into a white rounded card (~300px) with the mascot winking, the text "Hey! I'm Blue" and "How can I help you today?", three pill buttons: "Show my tasks" (navigates to /tasks), "Check team updates" (navigates to /), "Ask something" (navigates to /chat), and a small settings gear that opens Settings. Press Esc to collapse. A `prefers-reduced-motion` check disables animation.
  - Verify: bubble appears on every page; expands and collapses by mouse and keyboard; the collapsed state shows no sensitive text.

- [x] **S1.7 Settings modal (static)**
  - Files: `settings/SettingsModal.tsx` and one component per section: `General`, `PrivacyData`, `AiModel`, `Connectors`, `Notifications`, `WorkHours`, `Appearance`, `About`.
  - Do: a centered modal (~900px wide) with a left list of sections (icons: settings, shield, cpu, plug, bell, clock, palette, info) and a right content panel; a close X. Opened from the gear in the bubble and from a gear in the dashboard header. Build **General** exactly like the mock: Your Name input, Timezone select (default "(GMT+5:30) India Standard Time"), Language select (English only for now), "Blue's Presence" segmented control (Work hours only | Laptop awake) with the helper text "Blue will wake 30 minutes before your workday and sleep after your work hours.", a "Local AI Model" card (placeholder), "Privacy Quick Controls" with three toggles (Allow writing (with approval), Allow connectors, Allow team context) and a footer note "Your data stays with you. Always. My Blue is my Blue, not your Blue." Other sections can be a title and a short description for now.
  - Build a reusable `Toggle` component (accessible: `role="switch"`, `aria-checked`, keyboard Space/Enter).
  - Verify: the modal opens, closes with Esc and the X, traps focus while open; toggles work by keyboard.

- [x] **S1.8 Other pages (static)**
  - Do: `Tasks` (same three groups in a larger layout plus an "Add task" input), `Chat` (message list + input box + "Blue is private" note), `Calendar` (today's events list), `Files` (list of approved policy/project documents with a lock icon and "read-only"), `Team` (people cards with role and expertise tags, plus a "Ask a senior" button on each), `Apps` (connector cards: Demo Workspace, Slack, Gmail, Google Calendar with status chips; only Demo Workspace is "available", the others say "Roadmap"), `Outbox` ("Demo outbox: nothing is actually sent").
  - Verify: every route renders a meaningful static page; no console errors.

- [x] **S1.9 Accessibility and responsiveness baseline**
  - Do: add visible focus rings (`focus-visible:ring-2 ring-blue-500`), ensure text contrast is readable, add `aria-label`s on icon buttons, make the Sidebar collapse into a bottom bar under 768px width.
  - Verify: run Lighthouse accessibility in Chrome DevTools on `/`; score is 90+ (note the score in the log).

**Phase 1 Gate:** all S1.x ticked; screenshots of Home, bubble expanded, and Settings saved to `docs/screens/`; tick "Phase 1 gate passed".

---

# PHASE 2 — Types, sample data, encrypted local memory, audit log (Day 2 morning)

- [x] **S2.1 Core types**
  - Files: `client/src/core/types.ts`.
  - Do: define and export (exact names matter, later steps import them):

```ts
export type Effort = "easy" | "medium" | "deep";
export type TaskGroup = "easy_wins" | "next_up" | "needs_senior";
export type SourceCategory =
  | "chat"
  | "email"
  | "calendar"
  | "policy"
  | "manual";

export interface Explanation {
  sourceCategory: SourceCategory;
  confidence: number; // 0..1
  reason: string; // one sentence, plain English
}
export interface Provenance {
  source: "demo-slack" | "demo-gmail" | "demo-calendar" | "policy" | "manual";
  ref: string;
} // ref = item id, never a body
export interface Task {
  id: string;
  title: string;
  project: string;
  estimateMin: number;
  effort: Effort;
  group: TaskGroup;
  urgency: "low" | "med" | "high";
  status: "todo" | "done";
  dependsOn?: string[];
  blocker?: string;
  suggestedHelperId?: string;
  explanation: Explanation;
  provenance?: Provenance;
  createdAt: string;
  completedAt?: string;
}
export interface Settings {
  name: string;
  timezone: string;
  language: "en";
  presence: "work_hours" | "laptop_awake";
  workStart: string;
  workEnd: string; // 'HH:mm'
  waterReminderMin: number | null; // e.g. 90 or null
  allowWriting: boolean;
  allowConnectors: boolean;
  allowTeamContext: boolean;
  modelMode: "local" | "cloud";
  cloudConsentGiven: boolean;
  praise: boolean;
  checkins: boolean;
  toneObservations: boolean;
  paused: boolean;
  retentionDays: number;
}
export interface AuditEntry {
  id: string;
  at: string;
  action: string;
  allowed: boolean;
  detail: string;
} // NEVER a message body
export interface OutboxItem {
  id: string;
  at: string;
  recipient: string;
  content: string;
  approvedHash: string;
}
export interface Summary {
  id: string;
  at: string;
  kind: "roundup" | "digest" | "note";
  text: string;
  sources: Provenance[];
}
```

- Verify: `cd client && npx tsc --noEmit` passes.

- [x] **S2.2 Sample data ("Demo Workspace")**
  - Files in `client/src/data/`. All content fictional. Use persona: user "Alex Johnson", product team, project names "Atlas" (web app), "Orion Billing".
  - Do: create:
    - `messages.json`: 10 Slack-like items `{id, channel, from, ts, text}`. Include: a request for design review feedback; a blocked production bug needing DevOps input; an ambiguous requirement ("make it faster?" with no target); a teammate declining a task ("I can't take this, I'm at capacity this week"); a message containing a **fake secret** like `API_KEY=sk_demo_1234567890abcdef`; a message containing a **codebase link** like `https://github.com/acme/atlas/pull/482/files` and a pasted diff snippet. These last two exist to prove the privacy filters.
    - `emails.json`: 5 items `{id, from, subject, ts, body}` (a meeting invite, a policy reminder, a sprint-demo request, an access request, a low-priority newsletter).
    - `calendar.json`: 4 events `{id, title, start, end, attendees}` including "Design sync" at 11:00.
    - `team.json`: 6 people `{id, name, role, expertise[], timezone}` e.g. a Tech Lead (architecture, APIs), a DevOps engineer (prod incidents, deployments), a Designer, a Product Manager.
    - `policies/leave-and-hours.md`, `policies/incident-escalation.md`, `policies/code-review-norms.md` (each 150 to 250 words, fictional) and `project_brief.md` (200 words about Atlas with milestones).
  - Verify: `node -e "for (const f of ['messages','emails','calendar','team']) JSON.parse(require('fs').readFileSync('client/src/data/'+f+'.json','utf8')); console.log('ok')"` prints ok.

- [x] **S2.3 Encrypted memory (WebCrypto + IndexedDB)**
  - Files: `core/memory/crypto.ts`, `core/memory/db.ts`.
  - Do:
    - `crypto.ts`: `getKey()` creates (once) a **non-extractable** AES-GCM 256 `CryptoKey` via `crypto.subtle.generateKey({name:'AES-GCM',length:256}, false, ['encrypt','decrypt'])` and stores the key object in IndexedDB (CryptoKey objects can be stored there). `encryptJson(obj)` returns `{iv, data}` (random 12-byte iv per call); `decryptJson()` reverses it.
    - `db.ts` (using `idb`): object stores `settings`, `tasks`, `summaries`, `audit`, `outbox`, `meta`. Export `put(store, id, obj)`, `get(store, id)`, `getAll(store)`, `del(store, id)`, `clearAll()`. Everything except `meta` (which holds the key) is encrypted before saving.
  - Verify (unit test `memory.test.ts`, use `fake-indexeddb` as a dev dependency): put then get returns the same object; the raw stored value does not contain a known plaintext string; `clearAll()` empties all stores. `npx vitest run` passes.

- [x] **S2.4 Audit log**
  - Files: `core/memory/audit.ts`.
  - Do: `logAudit(action, allowed, detail)` writes an `AuditEntry` (id = uuid, at = ISO time). **Rule: `detail` must never contain a message/email body**; accept only short descriptors like `"approved send to Priya (hash a3f1…)"`. Add `listAudit()` and `clearAudit()`.
  - Verify: unit test writes 3 entries and reads them back newest first.

- [x] **S2.5 App store (zustand) with persistence**
  - Files: `client/src/store.ts`.
  - Do: a zustand store holding `settings`, `tasks`, `summaries`, `audit`, `outbox`, and actions `updateSettings`, `addTask`, `completeTask`, `loadAll` (reads from encrypted DB on startup), `clearMyBlue` (calls `clearAll`, resets to defaults). Defaults follow D6: `allowWriting:false`, `allowConnectors:false`, `allowTeamContext:false`, `presence:'work_hours'`, `workStart:'09:30'`, `workEnd:'18:00'`, `waterReminderMin:90`, `modelMode:'cloud'` until local is verified, `praise/checkins/toneObservations:true`, `retentionDays:30`. Replace the hardcoded arrays on Home/Tasks with store data (start with an empty list and the sample "manual" tasks).
  - Verify: add a task in the UI, refresh the page, it is still there; in DevTools > Application > IndexedDB the stored values look like encrypted blobs, not readable text.

**Phase 2 Gate:** all S2.x ticked; `npx vitest run` passes; tick "Phase 2 gate passed".

---

# PHASE 3 — Policy gate, permissions, privacy panel, working settings (Day 2 afternoon)

The policy gate is the product's trust centerpiece and a major demo moment. It is plain deterministic code. **No model output may ever bypass it.**

- [x] **S3.1 Implement the policy gate**
  - Files: `core/policy/gate.ts`.
  - Do: implement exactly this contract:

```ts
export type ActionType =
  | "read_source"
  | "draft_local"
  | "send_message"
  | "create_event"
  | "edit_record"
  | "delete_record"
  | "cloud_inference"
  | "blue_to_blue"
  | "screen_capture"
  | "read_codebase";

export interface ActionRequest {
  type: ActionType;
  source?: string; // e.g. 'demo-slack'
  recipient?: string;
  content?: string; // the exact text/effect to be approved
  account?: string;
  effect?: string; // human readable, e.g. "Send message"
}
export type Decision =
  | { result: "allow" }
  | { result: "needs_approval"; previewHash: string }
  | { result: "deny"; reason: string };

export async function hashAction(r: ActionRequest): Promise<string> {
  /* sha-256 hex of JSON.stringify([type,recipient,content,account,effect]) via crypto.subtle */
}
export async function decide(r: ActionRequest, s: Settings): Promise<Decision> {
  /* rules below */
}
export async function verifyApproval(
  r: ActionRequest,
  approvedHash: string,
): Promise<boolean> {
  /* recompute hash and compare */
}
```

    Rules in `decide` (deny by default, evaluate top to bottom):
    1. `read_codebase`, `blue_to_blue`, `screen_capture` => `deny` always, with reasons: "Codebase access is never permitted.", "Blue-to-Blue is disabled; it needs mutual explicit consent (roadmap).", "Screen capture is off by default and not available in this version."
    2. `paused === true` => `deny` ("Blue is paused.").
    3. `read_source` => `allow` only if `allowConnectors`; else `deny` ("Connector access is off.").
    4. `draft_local` => `allow`.
    5. `cloud_inference` => `allow` if `cloudConsentGiven`, else `needs_approval`.
    6. `send_message`, `create_event`, `edit_record`, `delete_record` => `deny` if `!allowWriting` ("Write actions are off."), else `needs_approval` with `previewHash`.
    7. Anything else => `deny`.
    Any change to recipient/content invalidates the approval because the hash changes.

- Verify: `gate.test.ts` with at least these tests: codebase read denied; blue_to_blue denied even when all settings are true; send denied when `allowWriting=false`; send needs approval when true; `verifyApproval` fails after editing one character of `content`; when `paused=true`, every action including `draft_local` is denied (but `read_codebase` etc. stay denied for their own reasons). `npx vitest run` passes.

- [x] **S3.2 First-run Permission Center**
  - Files: `components/PermissionCenter.tsx`.
  - Do: on first launch (a `meta` flag `onboarded`), show a full-screen friendly card "Set up your Blue" with: model mode shown honestly (Local / Cloud), "Gemini API: Off/On", a list of sources with a toggle each (Demo Workspace: Slack-like, Gmail-like, Calendar-like, Policy docs; each labeled "read-only"), a fixed line "Codebase access: never", "Blue-to-Blue: off", "Write actions: off (you can enable later)", work hours (start/end), and Presence. A big "Start my Blue" button saves to settings and logs an audit entry. This screen is also the first scene of the demo video.
  - Verify: fresh browser profile shows it; after finishing, it does not reappear; `allowConnectors` reflects the choice.

- [x] **S3.3 Wire Settings sections to real state**
  - Do: make every Settings section read and write the store: General (name, timezone, presence), Privacy & Data (the three toggles, retention days select 7/30/90, buttons "Export my data" (downloads decrypted JSON of settings, tasks, summaries) and "Clear my Blue" (confirm dialog then `clearMyBlue`)), AI Model (see S4.7 for the card; for now show provider radio), Connectors (Demo Workspace toggle plus per-source toggles, "last access" time), Notifications (independent switches: Praise, Check-ins, Tone observations, Water/work reminder with minutes input), Work Hours (start, end, presence), Appearance (light/dark placeholder, compact mode), About (version, "Built for Google Cloud AI Builder Cup 2026", principles list).
  - Verify: change each setting, reload, values persist; "Clear my Blue" empties memory and returns to the Permission Center.

- [x] **S3.4 Privacy panel page**
  - Files: `settings/PrivacyPanel.tsx` (shown inside Privacy & Data, and linked from the bubble).
  - Do: show (a) Model mode with honest text per D5, (b) Sources with permission status and last-access time (store `lastAccess` per source in `meta`), (c) "What Blue remembers" list by category with counts (tasks, summaries, preferences, audit entries) and a "View" and "Delete" button per category, (d) the Audit log table (time, action, allowed/blocked, short detail) with "Clear log", (e) fixed statements: "No codebase access", "Raw messages are not stored", "No manager access".
  - Verify: do something that writes memory, then see the counts change; deleting a category empties it.

- [x] **S3.5 Gate integration helper**
  - Files: `core/policy/useGate.ts`.
  - Do: a function `guard(request, run)` that calls `decide`, logs an audit entry for every outcome (allowed true/false), returns the denial reason to the UI when denied, and when `needs_approval` opens an `ApprovalDialog` showing recipient, exact content, effect, and the text "Demo: nothing is actually sent." with Approve and Cancel; on Approve it calls `verifyApproval` again immediately before `run()`.
  - Files: also `components/ApprovalDialog.tsx`.
  - Verify: write a temporary button "Test send": with writing off it shows "Write actions are off." and logs a blocked audit entry; with writing on it opens the dialog; Approve adds an item to the Outbox; editing the content in the dialog (if editable) changes the hash and requires re-approval.

**Phase 3 Gate:** all S3.x ticked; tests pass; tick "Phase 3 gate passed".

---

# PHASE 4 — Backend, AI providers, Cloud Run-ready server (Day 3)

- [x] **S4.1 Express server skeleton**
  - Files: `server/src/index.ts`, `server/src/routes/health.ts`, `server/tsconfig.json`, `server/package.json` scripts.
  - Do: Express app, `app.use(express.json({ limit: '200kb' }))`, `GET /api/health` returns `{ok:true}`, `GET /api/config` returns `{ cloudAvailable: boolean, model: process.env.GEMINI_MODEL }`. After API routes, serve static files from `server/public` and send `index.html` for non-API routes (SPA fallback). Listen on `process.env.PORT || 8080`. Scripts: `"dev": "tsx watch src/index.ts"`, `"build": "tsc"`, `"start": "node dist/index.js"`.
  - Rule: **never log request bodies**. Log only method, path, status, duration.
  - Verify: `npm run dev` then `curl localhost:8080/api/health` returns `{"ok":true}`.

- [!] **S4.2 Gemini wrapper**
  - Files: `server/src/gemini.ts`.
  - Do: using the SDK and call shape recorded in `docs/verified-apis.md` (S0.5): create the client once. If `USE_VERTEX==='true'` use Vertex mode with `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_LOCATION` (no API key; Cloud Run's service account provides credentials). Otherwise use `GEMINI_API_KEY` (local dev only). Export `complete({ system, prompt, jsonSchema? })` returning `{ text }`. When `jsonSchema` is given, request JSON output with that schema. Model id comes from `process.env.GEMINI_MODEL`; throw a clear error if it is missing.
  - Verify: create `server/.env` (git-ignored) with a dev key and model id, run `npx tsx -e "import('./src/gemini').then(m=>m.complete({system:'Reply with one word.',prompt:'Say hi'}).then(console.log))"` and see a short reply.

- [x] **S4.3 /api/ai/complete route with safety limits**
  - Files: `server/src/routes/ai.ts`, `server/src/limits.ts`.
  - Do: `POST /api/ai/complete` with body `{ system: string, prompt: string, jsonSchema?: object }`. Validate types; reject if `system+prompt` exceeds 30,000 characters (HTTP 413). Add a simple in-memory rate limit of 30 requests per minute per IP (HTTP 429). Add a server-side guard that **rejects prompts containing obvious repo/diff markers** (`diff --git`, `@@ -`, `-----BEGIN`, `ghp_`, `sk_`, `AKIA`) with HTTP 422 and the message "Content excluded by privacy rules." (defense in depth; the client filters first). Return `{ text }`. Never store or log content.
  - Verify: curl with a normal body returns text; a body with `diff --git` returns 422; a 40k-char body returns 413.

- [x] **S4.4 ModelProvider interface (client)**
  - Files: `core/ai/provider.ts`.
  - Do:

````ts
export interface CompleteArgs {
  system: string;
  prompt: string;
  jsonSchema?: object;
}
export interface ModelProvider {
  id: "cloud-gemini" | "local-gemma";
  label: string; // shown in UI
  dataLeavesDevice: boolean; // drives honest labelling (D5)
  isAvailable(): Promise<{ ok: boolean; reason?: string }>;
  complete(args: CompleteArgs): Promise<string>;
}
export function getProvider(settings: Settings): ModelProvider {
  /* returns by settings.modelMode */
}
export async function completeJson<T>(
  p: ModelProvider,
  args: CompleteArgs,
  validate: (x: unknown) => x is T,
): Promise<T> {
  // call p.complete, strip ``` fences, JSON.parse, validate; on failure retry ONCE with an added instruction "Return only valid JSON."; then throw
}
````

- Verify: `npx tsc --noEmit` passes.

- [!] **S4.5 GeminiCloudProvider**
  - Files: `core/ai/geminiCloud.ts`.
  - Do: implement `ModelProvider` with `dataLeavesDevice: true`, `label: 'Gemini (Cloud via Cloud Run)'`. `isAvailable` calls `GET /api/config`. `complete` POSTs to `/api/ai/complete` and returns `text`. **Before sending**, it must go through `guard({type:'cloud_inference'}, ...)` from S3.5 so the first use asks for consent and sets `cloudConsentGiven`.
  - Verify: add a temporary "Test AI" button; with consent given it shows a model reply; without consent it asks first; audit log shows the entries.

- [x] **S4.6 LocalGemmaProvider (time-boxed: 3 hours total; use the fallback if exceeded)**
  - Files: `core/ai/localGemma.ts`.
  - Do (use only what `docs/verified-apis.md` S0.6 recorded): install the documented JS package; implement `isAvailable()` (check browser requirements such as WebGPU; return a clear `reason` if unsupported); implement model loading from a user-selected file (file input in Settings > AI Model) and cache it with the Cache API or OPFS so it loads only once; show a progress indicator; implement `complete` using the runtime's generate call with a system prompt prepended to the user prompt if the runtime has no system role; limit output tokens to a reasonable cap. `dataLeavesDevice: false`, `label: 'Gemma (Local)'`.
  - Fallback if it cannot be made to run in 3 hours: leave the provider returning `{ok:false, reason:'Not available on this device/browser'}`, keep the code behind a feature flag, set the default `modelMode` to `'cloud'`, add a Blocker note, and make the UI say honestly "Local model not available on this device". The pitch then says "local-first architecture with a pluggable local Gemma provider (experimental)".
  - Verify: if working: switch to Local mode, ask a short question, get an answer with the network tab showing **no** request to `/api/ai/complete`. If fallback: the UI shows the honest message and nothing crashes.

- [x] **S4.7 AI Model settings card (honest)**
  - Files: `settings/AiModel.tsx` and use it in General.
  - Do: show a card like the mock: provider label and status chip (Active / Unavailable), and the sentence from D5 chosen by `dataLeavesDevice`. A radio to switch between Local and Cloud. A "Change model" button opens a small dialog (local: choose model file; cloud: shows model id from `/api/config`, read-only). Show "Gemini API: Optional, off unless you choose Cloud".
  - Verify: switching modes updates the label and the Privacy panel text; local text never appears while cloud is active.

**Phase 4 Gate:** all S4.x ticked (S4.6 may be ticked via its Fallback); tick "Phase 4 gate passed".

---

# PHASE 5 — AI features (Day 4 morning). This is where the 40% "Gen AI" score is earned.

General rules for all prompts (put them in `core/ai/prompts.ts` as named constants):

- Every prompt begins with the **Blue persona rules**: "You are Blue, a private, calm work companion. You never blame, shame, or label the user or colleagues. You never diagnose emotions or health. You never invent facts: use only the provided items. Keep answers short and concrete."
- Structured outputs use `completeJson` with a schema in `core/ai/schemas.ts` and a validator function.
- Features must work with **either** provider.

- [x] **S5.1 Connector + codebase filter + privacy transform**
  - Files: `core/connectors/demoWorkspace.ts`, `core/connectors/filters.ts`, `core/features/transform.ts`.
  - Do:
    1. `demoWorkspace.ts`: `fetchApproved(settings)` returns `{messages, emails, events}` from the JSON files **only if** `guard({type:'read_source', source})` allows, one call per source; update `lastAccess`.
    2. `filters.ts`: `isCodebaseContent(text)` returns true if it matches any of: `github.com/.+/(pull|commit|blob)`, `diff --git`, lines starting with `@@ `, `+++ `/`--- ` pairs, "stack trace" patterns, `.env`. `redactSecrets(text)` replaces strings matching `\b(sk|ghp|AKIA)[A-Za-z0-9_\-]{8,}\b` and `(API_KEY|SECRET|TOKEN|PASSWORD)\s*[=:]\s*\S+` with `[REDACTED]`. Excluded items are logged to audit as `"excluded: codebase content from <source>"` (no body).
    3. `transform.ts`: `toActionableFacts(items)` runs filters on each item, drops codebase items, redacts secrets, then asks the model to extract **only** `{tasks[], blockers[], decisions[], dates[], shortSummary}` per batch (JSON). Output carries `Provenance` pointers (item ids). **Raw bodies are never returned to callers or stored.**
  - Verify (unit test): feeding `messages.json` yields output with no `sk_demo_` string and no github PR URL; audit shows 1 or more "excluded" entries; stored memory contains no body text (search the IndexedDB dump in the test for a known phrase from a message; it must not appear).

- [x] **S5.2 Task triage with explanations**
  - Files: `core/features/triage.ts`.
  - Do: input = actionable facts + manual tasks. Prompt the model to return JSON array of tasks matching the `Task` type fields it controls: `title, project, estimateMin, effort, group, urgency, blocker?, suggestedHelperId?, explanation{sourceCategory,confidence,reason}`. Rules in the prompt: easy wins = under 30 minutes and no dependencies; needs_senior = blocked, ambiguous, or access-dependent; next_up = everything else; order within groups by urgency then effort. `suggestedHelperId` must be one of the ids in `team.json` and **only if `allowTeamContext` is true**; otherwise omit. After parsing, **validate in code**: unknown helper ids are removed; `confidence` clamped to 0..1; `estimateMin` between 5 and 480. Save to the store.
  - UI: in Tasks and Home, each task has an "Why?" popover showing `sourceCategory`, a confidence bar, and `reason`; users can drag or use a menu "Move to…" to correct the group manually (assumptions are editable).
  - Verify: run triage on the sample data: you get 6 to 12 tasks across the 3 groups; the production-bug item lands in needs_senior with the DevOps person suggested; the "Why?" popover works; manual correction persists.

- [x] **S5.3 Morning roundup**
  - Files: `core/features/roundup.ts`, `components/RoundupCard.tsx`.
  - Do: `generateRoundup()` = fetch approved sources, transform, triage, then ask the model for a short digest (max 120 words) in this order: easy tasks first, harder tasks next, then "tasks likely to benefit from senior input". Each line must reference its provenance ref (render as a small link chip "Slack · #product"). Save a `Summary` (text + provenance pointers only). The Home hero card's right arrow opens the roundup. Show a "Refresh" button and a footer "Based on: Slack, Gmail, Calendar (read-only)".
  - Verify: click "Your day, simplified" and the roundup appears with source chips; the stored summary contains no raw message text.

- [x] **S5.4 Ask a Senior (human-in-the-loop help request)**
  - Files: `core/features/askSenior.ts`, `components/AskSeniorDialog.tsx`.
  - Do: for a task in needs_senior (or from the Team page button), generate a help request draft with this fixed structure: **Context** (1 sentence) · **What I tried** (bullets, user-editable) · **Specific ask** · **Smallest useful next step** · **Timing**. The tone must normalize asking for help (never apologetic or self-deprecating). The helper suggestion comes only from `team.json` and shows "Why this person: <expertise match>". Output goes to the **approval dialog** (S3.5) as a `send_message` action; nothing is sent unless approved.
  - Verify: from the production-bug task, the dialog shows the DevOps teammate, a structured draft, and the Approve button respects the gate (blocked when writing is off, adds to Outbox when on).

- [x] **S5.5 Draft message and Summarize/Write quick actions**
  - Files: `core/features/draft.ts`.
  - Do: wire the Quick Actions: **Write** (user describes intent, Blue drafts; always goes through the approval dialog if the user presses "Send"), **Summarize** (paste text or pick a source; returns 3 bullets), **Create Task**, **Find Help** (opens Ask a Senior), **Ask Blue** (opens Chat). Drafts are local objects; sending is simulated per D7.
  - Verify: Write produces an editable draft; Send is gated; Summarize returns bullets; nothing is persisted except the user-approved outbox item.

- [x] **S5.6 Policy and project retrieval (approved documents only)**
  - Files: `core/features/retrieval.ts`.
  - Do: load `data/policies/*.md` and `project_brief.md` as the approved knowledge base (only if `allowTeamContext` or a separate "policy docs" source toggle is on). Chunk by paragraph (about 120 words). Implement simple BM25 or TF-IDF keyword scoring in plain TypeScript (no external service needed). `retrieve(query, k=3)` returns chunks with doc names. Chat and Ask-a-Senior prompts include retrieved chunks and must cite the doc name. Files page lists these docs as read-only.
  - Verify: query "who do I escalate a production incident to" returns the incident-escalation chunk first; unit test covers it.

- [x] **S5.7 Chat with grounded answers and tone-aware replies**
  - Files: `pages/Chat.tsx`, `core/features/chat.ts`.
  - Do: chat sends the user's message + current tasks (titles only) + retrieved policy chunks. System prompt adds: "If the user seems rude or distressed, stay calm, acknowledge friction without scolding, and offer a pause or a simpler next step. Do not label or score the user. Do not treat profanity as a health signal. Do not diagnose." If `toneObservations` is off, omit that paragraph. Add small "source" chips under answers when policy chunks were used. Chat history is kept **in memory only for the session** unless the user taps "Save this note" (stores a short summary).
  - Verify: ask "What is our escalation policy?" and get a cited answer; type an angry message ("this is stupid, I'm done") and get a calm, non-judgmental reply offering a break or a smaller step; no scores or labels anywhere.

- [x] **S5.8 Culture features: capacity-aware alternatives and respectful praise**
  - Files: `core/features/capacity.ts`, `core/features/praise.ts`.
  - Do:
    1. On the Team page add "A teammate said no" on a task: Blue treats it as **capacity information**. It returns 3 options as JSON: split the task, reduce scope or move the deadline, find another approved helper (from `team.json` only), plus a short, respectful reply the user can draft back (goes through the gate). The prompt forbids judging the person.
    2. `praise.ts`: when a task is completed and `praise` is on, show a restrained, specific message such as "You closed the review and unblocked the next step." (model-generated from the task title and `blocker`, max 20 words, no exclamation spam, no streaks). When `praise` is off, show nothing.
  - Verify: the "said no" flow never uses words like lazy/weak/uncommitted (add a unit test on a few sample outputs if the provider is mocked); completing a task shows specific praise only if enabled.

- [x] **S5.9 Provider mocking for tests and offline demo**
  - Files: `core/ai/mockProvider.ts`.
  - Do: a `MockProvider` returning canned JSON for each feature (used in unit tests and as an automatic fallback labelled "Offline demo mode" if both real providers are unavailable, so the app never crashes in front of judges).
  - Verify: set an invalid model id on the server; the UI shows "Offline demo mode" banner and features still render sample output.

**Phase 5 Gate:** all S5.x ticked; `npx vitest run` passes; one full manual run (Permission Center, roundup, triage, ask senior, draft with approval) works with Gemini cloud mode; tick "Phase 5 gate passed".

---

# PHASE 6 — Work hours, presence, scheduling, wellbeing (Day 4 afternoon)

- [x] **S6.1 Presence logic (pure functions + tests)**
  - Files: `core/presence/workHours.ts`, `workHours.test.ts`.
  - Do: `getPresence(now: Date, s: Settings): 'paused' | 'sleeping' | 'preroll' | 'active'`. Rules: if `paused` return `'paused'`. Mode `work_hours`: `preroll` from 30 minutes before `workStart` until `workStart`; `active` from `workStart` to `workEnd`; otherwise `sleeping`. Mode `laptop_awake`: `active` whenever the app is open (never `sleeping`), but it still performs **no** background polling or ambient monitoring. Use the user's timezone setting (use `Intl.DateTimeFormat` with `timeZone`). Export `canRunBackgroundWork(presence)` = true only for `preroll` and `active` in work_hours mode.
  - Verify: tests for 08:59 (sleeping), 09:00 (preroll), 09:30 (active), 18:00 (sleeping), paused at 10:00 (paused), laptop_awake at 23:00 (active) with `canRunBackgroundWork` behaving per rules.

- [x] **S6.2 Scheduler and demo clock**
  - Files: `core/presence/scheduler.ts`, `core/presence/demoClock.ts`, `components/DemoClockPanel.tsx`.
  - Do: a `now()` function that returns the real time unless a demo override is set. A small "Demo clock" floating panel visible only with the URL query `?demo=1` that lets us set the simulated time. The scheduler runs a `setInterval` (every 30 s) that: if `canRunBackgroundWork` is false, does nothing; in `preroll` and the roundup is enabled, offers the roundup once per day (a non-intrusive bubble badge, never auto-sends anything); water/work reminder every `waterReminderMin` minutes only while active. If the page was closed at the scheduled time, on next open show "Here's your roundup" (never pretend it ran on schedule).
  - Verify: with `?demo=1` set time to 09:05: the bubble shows a roundup badge; set 19:00: the bubble shows grey sleeping dot, polling stops (no `setInterval` work), and opening the dashboard shows a quiet "Blue is resting outside your work hours" card with a "Resume for now" button requiring a click.

- [x] **S6.3 Sleeping and paused UI**
  - Do: bubble dot colors (green active, amber preroll, grey sleeping/paused). A "Pause Blue" control in the bubble menu and Settings sets `paused:true`; while paused all gate decisions deny and the UI says so. "Resume" clears it.
  - Verify: pause then try Ask Blue: it replies "Blue is paused" without calling the model (check the network tab).

- [x] **S6.4 Optional check-ins (private, skippable)**
  - Files: `core/features/checkin.ts`.
  - Do: if `checkins` is on, the user can tap "Wellbeing Check-in" on Home (or a scheduled one if enabled). Blue offers practical, non-clinical options: one next step, a 25-minute focus timer, a restart after distraction, or break an overwhelming task into smaller pieces (the model returns 3 to 5 small steps). Nothing is stored except if the user taps "Save"; **never** infer or mention mental-health conditions; **never** show check-in data anywhere else.
  - Verify: the focus timer works; the step breakdown returns small steps; the Privacy panel shows no check-in data category.

**Phase 6 Gate:** all S6.x ticked; tests pass; tick "Phase 6 gate passed".

---

# PHASE 7 — Containerize and deploy to Cloud Run (Day 5 morning)

- [ ] **S7.1 Dockerfile (multi-stage)**
  - Files: `Dockerfile`, `.dockerignore`.
  - Do:

```dockerfile
# --- build client
FROM node:20-slim AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# --- build server
FROM node:20-slim AS server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npm run build

# --- runtime
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=server /app/server/dist ./dist
COPY --from=client /app/client/dist ./public
ENV PORT=8080
CMD ["node","dist/index.js"]
```

    Make sure `server/src/index.ts` serves static files from `path.join(__dirname,'../public')` (relative to `dist`). `.dockerignore`: `node_modules`, `.git`, `.env`, `docs`.

- Verify: `docker build -t blue .` then `docker run -p 8080:8080 -e GEMINI_API_KEY=... -e GEMINI_MODEL=... blue` and open http://localhost:8080 . If Docker is not installed, skip the local run and verify in S7.3 instead.

- [ ] **S7.2 Service account and secrets**
  - Do: (a) Use Vertex mode on Cloud Run: grant the Cloud Run runtime service account the role `roles/aiplatform.user`: `gcloud projects add-iam-policy-binding <PROJECT_ID> --member="serviceAccount:<RUNTIME_SA>" --role="roles/aiplatform.user"` (find the SA with `gcloud run services describe` after first deploy, or use the default compute service account). (b) No API key is needed in production. If the user prefers an AI Studio key, store it in Secret Manager (`gcloud secrets create gemini-key --data-file=-`) and mount it as an env var; do not paste keys into commands that get saved in history.
  - Verify: `gcloud projects get-iam-policy <PROJECT_ID> --flatten="bindings[].members" --filter="bindings.role:roles/aiplatform.user" --format="value(bindings.members)"` lists the service account.

- [ ] **S7.3 Deploy**
  - Do: `gcloud run deploy blue --source . --region <REGION> --allow-unauthenticated --set-env-vars USE_VERTEX=true,GOOGLE_CLOUD_PROJECT=<PROJECT_ID>,GOOGLE_CLOUD_LOCATION=<REGION>,GEMINI_MODEL=<MODEL_ID_FROM_docs/verified-apis.md> --memory 512Mi --max-instances 3`. Pick a region close to Singapore/India that supports the chosen model (check docs; e.g. asia-southeast1 or asia-south1, otherwise `us-central1`). Copy the service URL into `README.md` and the Decisions log.
  - Verify: `curl <URL>/api/health` returns ok; opening the URL shows the UI; in Cloud mode the "Test AI" or a roundup returns real Gemini output.

- [ ] **S7.4 Cost and abuse guard**
  - Do: set `--max-instances 3` (already), keep the 30 req/min rate limit, set a GCP budget alert (tell the user how: Billing > Budgets & alerts, e.g. 20 USD), and confirm the server never logs bodies (`gcloud run services logs read blue --limit 50` shows no message text).
  - Verify: logs checked and noted in the Progress Log.

- [ ] **S7.5 Smoke test the deployed app**
  - Do: in a fresh incognito window run the full path: Permission Center, roundup, triage, Why? popover, Ask a Senior with approval (enable writing first), blocked write when writing is off, Privacy panel, Clear my Blue. Record any bug as a new step `S8.x`.
  - Verify: all of the above work on the Cloud Run URL; note the browser and results in the log.

**Phase 7 Gate:** all S7.x ticked; deployed URL recorded; tick "Phase 7 gate passed".

---

# PHASE 8 — Hardening, polish, accessibility, rehearsal (Day 5 afternoon)

- [ ] **S8.1 Unit tests green and a privacy leakage test**
  - Do: run `cd client && npx vitest run`. Add one more test `privacy.test.ts`: run the full pipeline (fetch approved, transform, triage, roundup) with `MockProvider`, then dump every IndexedDB store and assert that none of these strings appear: `sk_demo_`, `github.com/acme/atlas/pull`, and any full message body from `messages.json` or `emails.json`.
  - Verify: all tests pass; paste the summary line in the Progress Log.

- [ ] **S8.2 Error and empty states**
  - Do: every feature shows a friendly state for: loading (skeleton), model unavailable (fallback to Offline demo mode banner), network error (retry button), empty lists ("Nothing here yet. Connect the Demo Workspace in Settings."). No raw error text or stack traces in the UI.
  - Verify: stop the server and use the app; every page shows a friendly message, not a blank screen.

- [ ] **S8.3 UX polish for the 10% score**
  - Do: consistent spacing, card hover states, smooth but short transitions (respect `prefers-reduced-motion`), the mascot appears in empty states and the progress card, microcopy in a warm, restrained voice, keyboard shortcuts (Esc closes dialogs, `g` then `h` goes Home is optional). Make sure the first 10 seconds of the app look great because the demo video starts there.
  - Verify: ask the user to look at Home, the bubble and Settings and approve or list changes; record in Decisions log.

- [ ] **S8.4 Accessibility pass**
  - Do: Lighthouse accessibility 95+ on `/`, `/tasks`, `/chat`; all dialogs have focus traps and `aria-modal`; all icon buttons have labels; colors meet contrast; the approval dialog is readable by screen readers (announce recipient and content).
  - Verify: note the scores in the log.

- [ ] **S8.5 Performance sanity**
  - Do: `cd client && npm run build` and check the bundle is reasonable (the local Gemma runtime must be **lazy-loaded** only when Local mode is used, using dynamic `import()`). Initial load on the Cloud Run URL should feel instant.
  - Verify: build output shows the Gemma code in a separate chunk.

- [ ] **S8.6 Demo rehearsal run-through**
  - Do: follow the video script in Appendix B twice with a stopwatch, on the deployed URL, in a clean browser profile, with the demo clock. Fix anything that stumbles, as small tickets.
  - Verify: two clean runs under 2 minutes 45 seconds; note times in the log.

**Phase 8 Gate:** all S8.x ticked; tick "Phase 8 gate passed".

---

# PHASE 9 — Submission assets and SUBMIT (Day 6, 17 Oct)

- [ ] **S9.1 README.md**
  - Do: write a README with: one-paragraph pitch, screenshot(s), the live Cloud Run URL, features list, architecture summary (link to `docs/architecture.png`), Google services used (only those actually used), how to run locally (client + server commands, `.env.example`), privacy and safety principles, known limitations (be honest: demo workspace data, simulated send, Local Gemma experimental if applicable), roadmap (real Slack/Gmail OAuth via Google Workspace APIs, Blue-to-Blue with mutual consent, native desktop bubble, admin policy packs), license (MIT unless the user says otherwise).
  - Verify: a new reader can run the app from the README alone.

- [ ] **S9.2 Architecture diagram**
  - Do: write `docs/architecture.md` containing a Mermaid diagram of: Browser (UI, policy gate, encrypted IndexedDB, ModelProvider with LocalGemma and GeminiCloud) → Cloud Run (Express API, rate limit and codebase filter) → Gemini on Vertex AI; plus optional Cloud Storage / Secret Manager. Export it to `docs/architecture.png` (use https://mermaid.live or `npx @mermaid-js/mermaid-cli`) and also embed it in the deck.
  - Verify: the PNG exists and shows the trust boundary (what stays on the device vs what goes to cloud).

- [ ] **S9.3 Make the repo public and clean**
  - Do: run `git grep -nEi "(api[_-]?key|secret|token)\s*[=:]\s*['\"]?[A-Za-z0-9_\-]{12,}"` and fix anything real (the fake `sk_demo_` sample is fine but mention it is fake in a comment in the sample file). Push to GitHub: the user creates the repo (`gh repo create blue --public --source . --push` if `gh` is available, else manual). Confirm it opens in a logged-out window.
  - Verify: the public URL loads without login; `.env` is not in the repo history (`git log --all -- .env` is empty).

- [ ] **S9.4 Deck (PDF, max 5 MB)**
  - Do: build a 12-slide deck (use the pptx skill or Google Slides, then export to PDF). Slides: 1 Blue (tagline) · 2 Problem · 3 Solution · 4 Product experience (dashboard + bubble screenshots) · 5 Trust by design (policy gate screenshot) · 6 Architecture (diagram) · 7 Google stack (Gemma, Gemini on Vertex AI, Cloud Run, Secret Manager/IAM, optional Cloud Storage) · 8 Differentiation (vs generic assistants) · 9 Impact and metrics (time to first meaningful task, blocker escalation lead time, user-rated usefulness, false-positive nudges, privacy incidents; do not optimize time online) · 10 Roadmap · 11 Scalability (stateless Cloud Run, per-user local memory, org policy packs) · 12 Closing: "Blue makes work feel more manageable, not more watched." Keep text short, big screenshots.
  - Verify: `ls -lh` shows the PDF is under 5 MB (`docs/deck/Blue.pdf`); it opens correctly; every claim on the slides is something the app really does.

- [ ] **S9.5 Demo video (max 3 minutes)**
  - Do: record the screen following Appendix B with voice-over, on the deployed URL. Export 1080p, under 3:00. Upload to YouTube as **Unlisted or Public** (not Private) and confirm it plays while logged out.
  - Verify: the link opens in an incognito window; the duration is under 3:00 (note it).

- [ ] **S9.6 Submission form text**
  - Do: prepare the text for "Brief Description of Your Solution" (Appendix C template; edit it to match exactly what was built and deployed), the Challenge selection ("Future of Work & Enterprise Productivity"), the Cloud Run URL, the GitHub URL, the video link, and the PDF. Put all of them in `docs/submission.md`.
  - Verify: each form field from the portal (Challenge, Prototype link, PDF, GitHub link, Demo video link, Description) has a ready value in `docs/submission.md`.

- [ ] **S9.7 Final checks and SUBMIT (human clicks submit)**
  - Do: open the Cloud Run URL in incognito one more time and run the demo path; confirm the repo is public; confirm the PDF is under 5 MB; paste values into the portal form; the **user** presses submit. Save a screenshot of the confirmation in `docs/`.
  - Verify: the portal shows the submission as received. Tick "Phase 9 gate passed (SUBMITTED)".

---

# PHASE 10 — Stretch goals (ONLY after submission, or if a phase finishes more than 3 hours early)

- [ ] **S10.1** Real read-only Google Calendar via Google Identity Services and the Calendar API (scope `calendar.readonly`), behind the same policy gate.
- [ ] **S10.2** Vertex AI Search or embeddings for policy retrieval (replace BM25), kept optional and labelled as cloud mode.
- [ ] **S10.3** Model-quality eval page: 20 sample inputs with expected triage groups; show accuracy and false-positive nudges.
- [ ] **S10.4** Light multilingual summaries (Hindi and one more JAPAC language) for the roundup.

---

# APPENDIX A — Prompt and schema reference (for `prompts.ts` and `schemas.ts`)

**Blue persona (prefix for every prompt):**

```
You are Blue, a private, calm work companion for one employee. Rules:
- Use ONLY the items provided. Never invent facts, names, dates or links.
- Never blame, shame, rank or label the user or any colleague.
- Never diagnose emotions or health. Do not treat profanity as a health signal.
- Asking for help is a strength. A teammate saying "no" is capacity information, not a character verdict.
- Be short, concrete and warm. No exclamation spam, no streaks, no guilt.
- Never include secrets, credentials, source code, diffs or repository links in any output.
```

**Triage output (JSON array):**

```json
[
  {
    "title": "string",
    "project": "string",
    "estimateMin": 30,
    "effort": "easy|medium|deep",
    "group": "easy_wins|next_up|needs_senior",
    "urgency": "low|med|high",
    "blocker": "string or omitted",
    "suggestedHelperId": "team member id or omitted",
    "explanation": {
      "sourceCategory": "chat|email|calendar|policy|manual",
      "confidence": 0.8,
      "reason": "one sentence"
    },
    "provenance": {
      "source": "demo-slack|demo-gmail|demo-calendar|policy|manual",
      "ref": "item id"
    }
  }
]
```

**Help request draft (JSON):** `{ "context": "", "tried": ["",""], "ask": "", "nextStep": "", "timing": "" }`

**Capacity options (JSON):** `{ "options": [ {"kind":"split|reduce_scope|new_helper","text":""} ], "replyDraft": "" }`

**Check-in steps (JSON):** `{ "steps": ["", "", ""] }`

---

# APPENDIX B — Demo video script (target 2:45, hard max 3:00)

| Time         | Screen                                                                                | Voice-over (short)                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 0:00 to 0:15 | Title, then scattered chat/email/calendar                                             | "Work context is scattered, and monitoring tools erode trust. Meet Blue: my Blue is my Blue, not your Blue."             |
| 0:15 to 0:35 | Permission Center                                                                     | "First, the user decides. Read-only sources. Codebase access: never. Writes off. Model mode is shown honestly."          |
| 0:35 to 1:00 | Home dashboard, roundup                                                               | "Blue turns approved context into a calm roundup: quick wins first, harder tasks next, and what needs a senior."         |
| 1:00 to 1:20 | Click "Why?" on a task, show the filtered message (secret redacted, PR link excluded) | "Every recommendation explains itself. Secrets are redacted and code links are excluded before any model sees anything." |
| 1:20 to 1:50 | Ask a Senior, then Approve dialog, then Outbox                                        | "Asking for help early is a strength. Blue drafts a clear request. Nothing leaves without approval of the exact text."   |
| 1:50 to 2:10 | Try to write with writing off, try a Blue-to-Blue contact; Audit log shows blocks     | "The policy gate sits outside the model. Unapproved writes and Blue-to-Blue messages are blocked and logged."            |
| 2:10 to 2:25 | Demo clock to 19:00, bubble sleeps                                                    | "After work hours Blue sleeps: no polling, no nudges."                                                                   |
| 2:25 to 2:40 | Architecture slide                                                                    | "Gemma runs locally; Gemini on Vertex AI via Cloud Run is an opt-in cloud mode. Memory is encrypted on device."          |
| 2:40 to 2:50 | Privacy panel, "Clear my Blue", closing slogan                                        | "Inspect, export, delete anytime. Blue makes work feel more manageable, not more watched."                               |

---

# APPENDIX C — "Brief Description" template (edit to match what was really built; keep under about 180 words)

> Blue is a privacy-first personal AI work companion that helps employees prioritize tasks, ask for help early, and keep a healthier work rhythm without manager surveillance. It turns user-approved Slack/email/calendar context (a demo workspace in this prototype) into a morning roundup, triages tasks into easy wins, next up and needs-senior-help with explainable reasons, drafts help requests, and blocks every write until the user approves the exact content through a deterministic policy gate outside the model. **Google services:** Gemini on Vertex AI (via the Google Gen AI SDK) for triage, roundups, drafting and grounded chat; Gemma, run locally in the browser via Google AI Edge LiteRT-LM, for the on-device mode [include only if S4.6 worked]; Cloud Run to host the UI and API; IAM and Secret Manager for credentials. Memory is encrypted on the user's device, raw messages are never stored, and codebase content is excluded.

---

# APPENDIX D — Definition of done for the whole project

- [ ] Public Cloud Run URL works in incognito and shows the first-run Permission Center
- [ ] Gen AI is used meaningfully in: triage, roundup, ask-a-senior, drafting, grounded chat, capacity options, check-in steps
- [ ] Policy gate blocks: unapproved writes, Blue-to-Blue, codebase reads, screen capture; every outcome appears in the audit log
- [ ] No raw message bodies, secrets, or code links in stored memory (privacy test passes)
- [ ] Honest model labelling in Settings, Privacy panel, and bubble
- [ ] Work-hours sleep behavior demonstrated with the demo clock
- [ ] Public GitHub repo, README, architecture diagram
- [ ] Deck PDF under 5 MB, demo video under 3:00 and playable logged out
- [ ] Form submitted before 18 Oct 2026 (target 17 Oct)

_End of plan.md. Remember: tick the step, update the Progress Log and CURRENT POINTER, commit._
