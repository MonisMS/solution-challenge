# NGO Response Hub

A real-time disaster response coordination platform built for the Google Solution Challenge. Field workers send free-text WhatsApp messages in Hindi, Hinglish, or English — Gemini 2.0 Flash extracts structured need data, Firebase stores it, and an NGO coordinator sees everything live on an interactive map and assigns nearby volunteers who get instant WhatsApp notifications.

## How it works

```
Field worker texts WhatsApp
  → Twilio webhook → /api/whatsapp/incoming
  → Gemini 2.0 Flash extracts: location, need type, severity, affected count
  → Stored in Firebase Firestore
  → Dashboard updates in real time (onSnapshot)
  → Coordinator assigns a volunteer (scored by proximity + skill + availability)
  → Volunteer receives WhatsApp notification
  → Volunteer replies back ("on my way", "arrived", "done")
  → Dashboard reflects status live
  → Unattended critical needs trigger escalation alerts after 10 min (1 min in test mode)
```

## Three user roles

| Role | Name | How they interact |
|------|------|-------------------|
| Field worker | Rahul | Sends WhatsApp messages to the Twilio number |
| NGO coordinator | Priya | Uses the web dashboard |
| Volunteer | Arjun | Receives WhatsApp notifications, replies with status |

## Tech stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | Web framework |
| Firebase Firestore | Real-time database |
| Gemini 2.0 Flash | Need extraction + situation briefs |
| Twilio WhatsApp | Inbound field reports + outbound volunteer notifications |
| Leaflet + react-leaflet | Interactive map (no API key required) |
| Tailwind CSS v4 | Styling |
| TypeScript | Type safety |

---

## Local setup

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A [Firebase](https://console.firebase.google.com) project with Firestore enabled
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)
- A [Twilio](https://twilio.com) account with the WhatsApp Sandbox activated
- [ngrok](https://ngrok.com) to expose your local server for Twilio webhooks

### 1. Clone and install

```bash
git clone <your-repo-url>
cd solution-challenge
pnpm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in each value — see the section below for where to find them.

### 3. Firebase setup

1. Go to [Firebase Console](https://console.firebase.google.com) → create a project
2. Enable **Firestore Database** (start in test mode for development)
3. Go to **Project Settings → General** — copy the web app config values into the `NEXT_PUBLIC_FIREBASE_*` vars
4. Go to **Project Settings → Service Accounts** → Generate new private key — download the JSON file, minify it to one line, and paste it as the value of `FIREBASE_SERVICE_ACCOUNT_KEY`

### 4. Gemini setup

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key and set it as `GEMINI_API_KEY`
3. To develop without hitting the API, set `GEMINI_MOCK=true` — this uses keyword matching instead

### 5. Twilio WhatsApp Sandbox setup

1. Sign up at [twilio.com](https://twilio.com) → go to **Messaging → Try it out → Send a WhatsApp message**
2. Follow the instructions to activate the sandbox (you'll be given a code like `join bear-depth`)
3. Every phone number that needs to receive messages must opt in by texting that code to `+1 415 523 8886`
4. Copy your **Account SID** and **Auth Token** from the Twilio Console dashboard
5. Set `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886`

### 6. Expose your local server with ngrok

```bash
ngrok http 3000
```

Copy the `https://xxxx.ngrok-free.app` URL and go to **Twilio Console → Sandbox Configuration** → set:

- **"When a message comes in"** → `https://xxxx.ngrok-free.app/api/whatsapp/incoming`

### 7. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app will auto-seed 12 Mumbai volunteers into Firestore on first load.

---

## Environment variables

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Same as above |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Same as above |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Same as above |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Console → Project Settings → Service Accounts → Generate new private key (minify JSON to one line) |
| `GEMINI_API_KEY` | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| `GEMINI_MOCK` | Set `true` to skip Gemini API calls during development |
| `TWILIO_ACCOUNT_SID` | Twilio Console → Account Info |
| `TWILIO_AUTH_TOKEN` | Twilio Console → Account Info |
| `TWILIO_WHATSAPP_FROM` | Always `whatsapp:+14155238886` for the sandbox |
| `COORDINATOR_PHONE` | Phone number that receives escalation alerts (format: `+919XXXXXXXXX`) |
| `NEXT_PUBLIC_TEST_MODE` | `true` = 1-min escalation threshold + 30s polling (for demos); `false` = 10-min threshold |
| `ADMIN_SECRET` | Any secret string — required as `x-admin-secret` header for the `/api/fix-phones` admin endpoint |

---

## Testing end to end

### Step 1 — Send a field report
Text the Twilio sandbox number from any opted-in phone:
```
urgent flood in dharavi, 200 log phaase hain, shelter chahiye
```
You'll receive an auto-reply confirmation and the need will appear on the dashboard map in real time.

### Step 2 — Assign a volunteer
On the dashboard:
1. Click the need card or map pin
2. Click **Assign** next to a volunteer (sorted by match score)
3. Edit the WhatsApp message if needed, then click **Confirm**

The volunteer receives a WhatsApp notification. You'll see a toast confirming delivery.

### Step 3 — Volunteer replies
Reply to the WhatsApp with any of these:

| Reply | Effect |
|-------|--------|
| `on my way` | ETA updates to "En route" |
| `arrived` | ETA updates to "On site" |
| `eta 15 min` | ETA updates to "15 min" |
| `done` | Need auto-resolves, volunteer marked available |
| `can't make it` | Need reopens, volunteer freed |

The dashboard reflects the update live without any manual refresh.

### Step 4 — Situation Brief
Click **📋 Situation Brief** in the header. Gemini generates a 2–3 sentence operational summary of current needs and volunteer capacity.

### Step 5 — Escalation (test mode)
With `NEXT_PUBLIC_TEST_MODE=true`, any critical need that stays unassigned for more than **1 minute** triggers a WhatsApp alert to `COORDINATOR_PHONE`. The need card shows a pulsing 🚨 badge on the dashboard.

---

## Deploying to Vercel

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repository
3. In **Settings → Environment Variables**, add every variable from your `.env.local`
4. Deploy — Vercel gives you a URL like `https://your-app.vercel.app`
5. Update the Twilio webhook URL to `https://your-app.vercel.app/api/whatsapp/incoming`

No other changes needed — Firebase, Gemini, and Twilio are already cloud services.

---

## Project structure

```
app/
  page.tsx                          # Dashboard shell (Server Component)
  volunteers/page.tsx               # Volunteer self-registration page
  api/
    whatsapp/incoming/route.ts      # Twilio inbound webhook
    whatsapp/notify/route.ts        # Outbound WhatsApp sender
    needs/route.ts                  # GET all needs, PATCH to assign/resolve
    needs/escalate/route.ts         # POST — escalate unattended critical needs
    needs/brief/route.ts            # GET — Gemini situation brief
    volunteers/route.ts             # GET all volunteers, POST to register
    seed/route.ts                   # POST — seed demo volunteers
    fix-phones/route.ts             # POST — admin: bulk update volunteer phones

components/
  Dashboard.tsx                     # Real-time state, 3-panel layout
  NeedMap.tsx                       # Leaflet map with severity markers
  PriorityQueue.tsx                 # Needs list sorted by severity
  NeedDetailPanel.tsx               # Need detail + volunteer matches
  VolunteerPanel.tsx                # Volunteer roster
  VolunteerDrawer.tsx               # Slide-in volunteer registration form
  VolunteerProfileModal.tsx         # Volunteer profile + availability toggle
  AssignConfirmDialog.tsx           # 2-click assignment confirm with WhatsApp preview
  SituationBriefModal.tsx           # Gemini situation brief modal
  Toast.tsx                         # Success/error toast notifications

lib/
  types.ts          # Shared TypeScript interfaces
  firebase.ts       # Client SDK singleton (browser, onSnapshot)
  firebase-admin.ts # Admin SDK singleton (server, API routes)
  gemini.ts         # Need extraction + mock fallback
  twilio.ts         # sendWhatsApp helper
  matching.ts       # Volunteer scoring: 0.5×proximity + 0.3×skill + 0.2×availability
  wards.ts          # Mumbai ward → lat/lng lookup (25 wards, fuzzy matching)
```

---

## Commands

```bash
pnpm dev      # Start development server
pnpm build    # Production build
pnpm start    # Start production server
pnpm lint     # Run ESLint
```
