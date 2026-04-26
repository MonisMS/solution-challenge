# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: This is Next.js 16

This is **Next.js 16.2.4**. Before writing any Next.js-specific code, check `node_modules/next/dist/docs/` for current conventions. Heed deprecation notices.

## Commands

```bash
pnpm dev        # start dev server
pnpm build      # production build
pnpm start      # start production server
pnpm lint       # run eslint
```

No test runner is configured yet.

## Project: NGO Community Needs + Volunteer Matching

Real-time coordination platform that turns WhatsApp field reports into actionable, mapped community needs and matches volunteers to tasks.

**Three users:**
- **Field worker (Rahul)** — sends free-text WhatsApp messages. Zero behavior change required.
- **NGO coordinator (Priya)** — web dashboard: live needs on a map, assigns volunteers.
- **Volunteer (Arjun)** — receives WhatsApp notifications when matched.

**Core data flow:**
```
WhatsApp message → Twilio webhook → /api/whatsapp/incoming
  → Gemini Flash (extracts: location, need_type, severity, affected_count as JSON)
  → Firebase Firestore (stores structured need)
  → Dashboard real-time listener (Firestore onSnapshot)
  → Volunteer matching score (0.5×proximity + 0.3×skill + 0.2×availability)
  → Twilio outbound WhatsApp → volunteer notification
```

## Tech Stack

| Package | Purpose |
|---|---|
| `firebase` | Client SDK — browser real-time (onSnapshot) only |
| `firebase-admin` | Server SDK — used in all API Route Handlers |
| `@google/generative-ai` | Gemini 2.0 Flash for need extraction |
| `twilio` | WhatsApp inbound webhook + outbound notifications |
| `leaflet` + `react-leaflet` | Map with markers, no API key needed |

## Architecture

**App Router** — all routes under `app/`. API routes use Route Handler convention (`app/api/.../route.ts`).

```
app/
  page.tsx                          # Priya's dashboard shell (Server Component)
  volunteers/page.tsx               # Volunteer self-registration form
  api/
    whatsapp/incoming/route.ts      # Twilio inbound webhook
    whatsapp/notify/route.ts        # Outbound WhatsApp sender
    needs/route.ts                  # GET all needs, PATCH to assign volunteer
    volunteers/route.ts             # GET all volunteers, POST to register
components/
  Dashboard.tsx                     # 'use client' — onSnapshot state, 3-panel layout
  NeedMap.tsx                       # 'use client' — Leaflet map (always dynamic import ssr:false)
  PriorityQueue.tsx                 # Need list sorted by severity
  VolunteerPanel.tsx                # Volunteer roster with availability toggle
lib/
  types.ts          # Shared interfaces: CommunityNeed, Volunteer, NeedExtraction
  firebase.ts       # Client SDK singleton (uses NEXT_PUBLIC_ vars)
  firebase-admin.ts # Admin SDK singleton (uses FIREBASE_SERVICE_ACCOUNT_KEY)
  gemini.ts         # Gemini extraction + mock fallback
  twilio.ts         # Twilio client + sendWhatsApp helper
  matching.ts       # Volunteer scoring algorithm
  wards.ts          # Hardcoded Mumbai ward → lat/lng lookup
```

## Key Implementation Rules

- **Two Firebase SDKs**: `lib/firebase.ts` (client, browser only, `onSnapshot`) vs `lib/firebase-admin.ts` (server, API routes only). Never import `firebase-admin` in client components or vice versa.
- **Ward geocoding**: Never call a geocoding API. Always use `resolveWard()` from `lib/wards.ts` — handles fuzzy/Hinglish spellings.
- **Gemini mock mode**: Set `GEMINI_MOCK=true` in `.env.local` to use keyword-based extraction without hitting the API. Flip to `false` when billing is enabled.
- **Leaflet + Next.js**: `NeedMap.tsx` must be `'use client'` and always imported with `dynamic(() => import(...), { ssr: false })`. Import `leaflet/dist/leaflet.css` inside the component. Fix broken marker icons with `L.Icon.Default.mergeOptions(...)`.
- **Twilio webhook**: Parse with `request.formData()` not `request.json()` — Twilio POSTs `application/x-www-form-urlencoded`. Always return HTTP 200 with empty `<Response/>` TwiML even on errors — non-200 causes Twilio to retry and creates duplicates.
- **Twilio sandbox**: Each demo phone must opt in by texting "join [sandbox-code]" to +14155238886 before the demo.
- **Firebase rules**: Open (`allow read, write: if true`) for demo. Tighten before production.
- **Path alias**: `@/*` maps to repo root (tsconfig).
- **onSnapshot in dashboard**: Must be in a `'use client'` component inside `useEffect` with cleanup (`return unsubscribe`). Cannot use real-time listeners in Server Components.

## Environment Variables

```
NEXT_PUBLIC_FIREBASE_API_KEY        # client SDK
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN    # client SDK
NEXT_PUBLIC_FIREBASE_PROJECT_ID     # client SDK
NEXT_PUBLIC_FIREBASE_APP_ID         # client SDK
FIREBASE_SERVICE_ACCOUNT_KEY        # admin SDK — full service account JSON as one line
GEMINI_API_KEY                      # Gemini API
GEMINI_MOCK                         # set to "true" to bypass Gemini API (keyword mock)
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM                # format: whatsapp:+14155238886
```
