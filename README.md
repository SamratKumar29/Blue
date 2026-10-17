# Blue: Work & Productivity Companion

> "My Blue is my Blue, not your Blue."

Blue is a privacy-first, personal AI work companion for employees. It reads only the sources you approve and turns them into a calm morning roundup. It sorts your tasks into **Easy wins / Next up / Needs senior help**, helps you ask for help early, and drafts messages, but never sends anything without your approval of the exact content. Managers get no dashboard, no scores and no access to your memory.

Built for the **Google Cloud AI Builder Cup 2026**, theme: *Future of Work & Enterprise Productivity*.

**Live demo:** https://blue-43899504636.us-central1.run.app

## How Google AI is used

- **Gemini on Vertex AI** (`gemini-3.8-flash`): roundup, task triage, drafting and chat. Calls go through the Express server on Cloud Run. Gemini is called only after a one-time consent prompt, and content is redacted before it is sent.
- **Gemma (local, in the browser)** through LiteRT-LM and WebGPU: an optional on-device mode in which no data leaves the device (experimental).
- **Cloud Run** hosts one container that serves both the UI and `/api`.

## Key ideas

- **Read-only by default.** A deterministic policy gate outside the model decides every action. Write actions require an approval bound to the exact content.
- **Encrypted local memory.** Data is stored in IndexedDB with AES-GCM encryption under a non-extractable WebCrypto key.
- **Never reads your code.** Repos, diffs and secrets are filtered out in the client and again on the server.
- **Audit log, pause, export and "Clear my Blue"** are always available to the user.

## Project layout

```
client/   React 18 + TypeScript + Vite + Tailwind (UI, policy gate, memory, AI providers, demo data)
server/   Node 20 + Express + @google/genai (Gemini proxy, rate limits, privacy filter)
e2e/      Smoke test script
docs/     Screenshots
Dockerfile
FutureWork.md   Limitations and roadmap
```

## Run locally

```bash
cp .env.example .env    # set GEMINI_MODEL, USE_VERTEX=true, GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION=global
gcloud auth application-default login

cd server && npm install && npm run dev   # http://localhost:8080
cd client && npm install && npm run dev   # Vite dev server, proxies /api to :8080
cd client && npx vitest run               # unit tests
```

If no model is reachable, Blue switches to a clearly labelled offline demo mode.

## Deploy (Cloud Run)

```bash
gcloud run deploy blue --source . --region us-central1 \
  --service-account blue-run@<PROJECT_ID>.iam.gserviceaccount.com \
  --allow-unauthenticated --max-instances 2 --memory 512Mi \
  --set-env-vars USE_VERTEX=true,GOOGLE_CLOUD_PROJECT=<PROJECT_ID>,GOOGLE_CLOUD_LOCATION=global,GEMINI_MODEL=gemini-3.8-flash
```

The runtime service account needs only `roles/aiplatform.user`. No API key is used in production.

## Gmail + Google Calendar (read-only)

Sign-in runs in the browser with Google Identity Services. The access token stays in the tab's memory only. Blue reads mail headers and preview text (`gmail.readonly`) and events (`calendar.readonly`).

1. Enable the APIs: `gcloud services enable gmail.googleapis.com calendar-json.googleapis.com`
2. Google Cloud console > **Google Auth Platform**: set the audience to *External* and add your account (plus any judges) under **Test users**. Under **Data access**, add the `gmail.readonly` and `calendar.readonly` scopes.
3. **Clients** > *Create client* > *Web application*. Under **Authorized JavaScript origins**, add `http://localhost:5173` and your Cloud Run URL.
4. Put the client ID in `.env` as `GOOGLE_OAUTH_CLIENT_ID`. For Cloud Run, run:
   `gcloud run services update blue --region us-central1 --update-env-vars GOOGLE_OAUTH_CLIENT_ID=<id>`

All sample data is fictional.
