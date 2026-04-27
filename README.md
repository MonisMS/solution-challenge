# NGO Response Hub

A real-time disaster response coordination platform for Mumbai NGOs. Field workers send free-text WhatsApp messages in Hindi, Hinglish, or English — Gemini 2.0 Flash extracts structured need data, Firebase stores it, and a coordinator sees everything live on a map and dispatches the nearest qualified volunteer with one click.

Field workers can also attach video to their report. Volunteers receive WhatsApp dispatches and reply with status updates ("on my way", "arrived", "done") that flow back into the dashboard in real time.

> See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for a full system breakdown — data flow, key modules, and design decisions.

---

## How it works

```
Field worker texts WhatsApp (with optional video)
  → Twilio webhook → /api/whatsapp/incoming
  → Gemini 2.0 Flash extracts: location · need type · severity · affected count
  → Stored in Firestore (with media URL if attached)
  → Dashboard updates in real time via onSnapshot
  → Coordinator clicks a marker → context card slides in with video preview + nearest responders
  → Click "Assign" → volunteer gets a WhatsApp dispatch
  → Volunteer replies with status ("on my way" / "arrived" / "done")
  → Dashboard reflects updates live; "done" auto-resolves the alert
  → Unattended critical alerts trigger an escalation WhatsApp to the coordinator
```

---

## Stack

| Layer | Tech |
|---|---|
| Web framework | Next.js 16 (App Router, Turbopack) |
| Realtime database | Firebase Firestore |
| AI extraction | Gemini 2.0 Flash via `@google/generative-ai` |
| Messaging | Twilio WhatsApp (sandbox + production) |
| Map | Leaflet + react-leaflet, CartoDB Voyager tiles |
| Styling | Tailwind CSS v4 |
| Type safety | TypeScript strict mode |
| Hosting | Vercel |

---

## Local setup

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A Firebase project with Firestore enabled
- A Google AI Studio (Gemini) API key
- A Twilio account with WhatsApp Sandbox activated
- ngrok to expose localhost to Twilio's webhook

### 1. Install

```bash
git clone <your-repo-url>
cd solution-challenge
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in each value (see the **Environment variables** section below).

### 3. Firebase

1. Firebase Console → create a project
2. Build → Firestore Database → Create database (region `asia-south1` for Mumbai)
3. Project Settings → General → Your apps → register a web app, copy config into `NEXT_PUBLIC_FIREBASE_*`
4. Project Settings → Service Accounts → Generate new private key — minify the JSON to a single line and paste as `FIREBASE_SERVICE_ACCOUNT_KEY`
5. Firestore → Rules — paste:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read: if true;
         allow write: if false;
       }
     }
   }
   ```
   This blocks browser writes — only the Admin SDK (server-side) can write, which is what we want.

### 4. Gemini

Go to [Google AI Studio](https://aistudio.google.com/apikey) → create an API key → set as `GEMINI_API_KEY`. Set `GEMINI_MOCK=true` to bypass the API and use keyword matching during development.

### 5. Twilio WhatsApp Sandbox

1. Sign up at twilio.com → Messaging → Try it out → Send a WhatsApp message
2. Activate the sandbox; it gives you a join code (e.g. `join bear-depth`)
3. Every phone that needs to receive messages must text the join code to `+1 415 523 8886`
4. Copy your **Account SID** and **Auth Token** from the dashboard
5. Set `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886`

### 6. Webhook (local dev)

```bash
ngrok http 3000
```

Copy the HTTPS URL and in **Twilio Console → Sandbox Configuration**:
- **When a message comes in**: `https://xxxx.ngrok-free.app/api/whatsapp/incoming` · `HTTP POST`

### 7. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The seed endpoint runs automatically and creates 12 demo Mumbai volunteers in Firestore.

---

## Environment variables

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase → Project Settings → Web app config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ↑ |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ↑ |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ↑ |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase → Service Accounts → Generate private key (minify the JSON to one line) |
| `GEMINI_API_KEY` | aistudio.google.com/apikey |
| `GEMINI_MOCK` | `true` to skip Gemini calls during dev |
| `TWILIO_ACCOUNT_SID` | Twilio Console |
| `TWILIO_AUTH_TOKEN` | Twilio Console |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+14155238886` for sandbox |
| `COORDINATOR_PHONE` | Phone that gets escalation alerts (e.g. `+919XXXXXXXXX`) |
| `NEXT_PUBLIC_TEST_MODE` | `true` = 1-min escalation + 30s polling (demos); `false` = 10-min |
| `ADMIN_SECRET` | Any random string — required as `x-admin-secret` for `/api/fix-phones` |

---

## Testing end-to-end

**1. Send a field report** — text the Twilio sandbox from any opted-in phone (attach a video to populate the video preview):
```
urgent flood in dharavi, 200 log phaase hain, shelter chahiye
```
You'll get an auto-reply and the alert appears on the map within seconds.

**2. Click the marker** — a glass context card slides in with the video preview, severity, location, quote from the report, and the nearest responders.

**3. Assign a volunteer** — click **Assign** on a responder → confirm message → volunteer gets a WhatsApp dispatch.

**4. Volunteer replies** — replies are detected automatically:

| Reply | Effect |
|---|---|
| `on my way` / `coming` / `nikal` | ETA updates to "En route" |
| `arrived` / `pahuncha` / `here` | ETA updates to "On site" |
| `eta 15 min` | ETA updates to "15 min" |
| `done` / `kaam khatam` | Alert auto-resolves; volunteer freed |
| `can't make it` / `nahi` | Alert reopens; volunteer freed |

**5. After assignment** — the assigned card now offers:
- 💬 **Send message** — quick custom WhatsApp to the volunteer
- ↺ **Reassign** — release the volunteer (auto-notifies them) and reopen the alert
- ✓ **Mark resolved** — close the alert and free the volunteer
- → **View profile** — opens `/profile/[id]`

**6. Situation Brief** — click **📋 Brief** in the header. Gemini generates a 2–3 sentence operational summary.

**7. Escalation** — with `NEXT_PUBLIC_TEST_MODE=true`, any critical alert open for >1 min triggers a WhatsApp to `COORDINATOR_PHONE` and a pulsing 🚨 indicator on the dashboard.

---

## Deploying to Vercel

1. Push to GitHub
2. vercel.com → Import the repo (auto-detects Next.js)
3. Project settings → Environment Variables → paste every key from `.env.local`
4. Deploy
5. Update Twilio webhook URL to `https://your-app.vercel.app/api/whatsapp/incoming`

Every push to `main` auto-deploys in ~90 seconds.

---

## Commands

```bash
pnpm dev                # Start dev server (http://localhost:3000)
pnpm build              # Production build
pnpm start              # Start production server
pnpm lint               # ESLint
pnpm exec tsc --noEmit  # Type-check without emitting
```

---

## License

MIT
