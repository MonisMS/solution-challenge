# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # start dev server (http://localhost:3000)
pnpm build      # production build
pnpm start      # start production server
pnpm lint       # run eslint
pnpm exec tsc --noEmit  # type-check without emitting
```

No test runner is configured.

## Project

Real-time NGO disaster response platform for Mumbai. Field workers send free-text WhatsApp messages (Hindi/Hinglish/English), Gemini 2.0 Flash extracts structured data, Firebase stores it, and a coordinator dashboard assigns volunteers who get WhatsApp notifications and reply with status updates.

**Core data flow:**
```
WhatsApp → Twilio webhook → /api/whatsapp/incoming
  → check if sender is a volunteer with active assignment → handle status reply
  → else: Gemini extracts {location, need_type, severity, affected_count}
  → resolveWard() maps location name → {lat, lng}
  → Firestore 'needs' collection
  → Dashboard onSnapshot → coordinator assigns volunteer
  → /api/whatsapp/notify sends task to volunteer
  → volunteer replies → incoming route updates need (eta, status, auto-resolve)
```

**Escalation:** Dashboard polls `/api/needs/escalate` every 30s (TEST_MODE) / 60s (prod). Any `critical` + `open` need older than 1 min (TEST_MODE) / 10 min (prod) gets a WhatsApp alert to `COORDINATOR_PHONE` and is marked `escalated: true`.

## Architecture

**Next.js 16.2.4 App Router.** `app/page.tsx` is a Server Component that renders `<Dashboard />` via dynamic import.

### Two Firebase SDKs — never mix them

- `lib/firebase.ts` — client SDK, browser only, used for `onSnapshot` real-time listeners in `'use client'` components
- `lib/firebase-admin.ts` — server SDK, used exclusively in API route handlers (`app/api/`)

### API routes (`app/api/`)

| Route | Method | Purpose |
|---|---|---|
| `whatsapp/incoming` | POST | Twilio webhook — volunteer reply detection OR new field report + auto-reply |
| `whatsapp/notify` | POST | Send outbound WhatsApp via Twilio |
| `needs` | GET / PATCH | Fetch all needs / update status or assignment |
| `needs/escalate` | POST | Check for unattended critical needs, send alerts |
| `needs/brief` | GET | Gemini-generated situation summary |
| `volunteers` | GET / POST | Fetch all / register new volunteer |
| `seed` | POST | Seed 12 demo volunteers (skips if ≥ 12 already exist) |
| `fix-phones` | POST | Admin: bulk-update all volunteer phones (requires `x-admin-secret` header) |

### Component responsibilities

- `Dashboard.tsx` — owns all state: needs, volunteers, selectedNeed, assignTarget, toast, brief modal, escalation polling interval
- `NeedMap.tsx` — Leaflet map, always imported `dynamic(() => import(...), { ssr: false })`; `MapController` child uses `useMap()` for `flyTo`
- `AssignConfirmDialog.tsx` — 2-step confirm with editable WhatsApp message preview
- `SituationBriefModal.tsx` — displays Gemini brief, has Refresh button
- `Toast.tsx` — auto-dismisses after 4s via `setTimeout` in `useEffect`

### Key lib files

- `lib/matching.ts` — `scoreVolunteer()`: `0.5 × proximity + 0.3 × skill + 0.2 × availability`. Proximity uses Haversine; score = 0 beyond 10 km.
- `lib/wards.ts` — **hardcoded Mumbai wards only**. `resolveWard()` does fuzzy/Hinglish matching. Falls back to `{lat: 19.0376, lng: 72.854}` (central Mumbai) if no match. Never call an external geocoding API.
- `lib/gemini.ts` — `extractNeed()` calls Gemini 2.0 Flash; `parseGeminiJson()` strips markdown fences before `JSON.parse`. Falls back to keyword mock on error. Set `GEMINI_MOCK=true` to bypass API entirely.
- `lib/types.ts` — single source of truth for `CommunityNeed`, `Volunteer`, `NeedExtraction`. `CommunityNeed` includes `escalated?`, `escalated_at?`, `volunteer_eta?`, `volunteer_reply?`.

## Critical implementation rules

- **Twilio webhook**: parse with `request.formData()`, not `request.json()` — Twilio POSTs `application/x-www-form-urlencoded`. Always return HTTP 200 with `<?xml version="1.0"?><Response></Response>` even on errors — non-200 triggers Twilio retries and duplicate needs.
- **Volunteer reply detection**: `incoming/route.ts` queries Firestore for a volunteer by phone, then checks for an active `assigned` need. Unrecognised replies from volunteers still return `true` (no second field report created). Only falls through to field-report flow if sender is not a registered volunteer OR has no active assignment.
- **`FieldValue.increment` and `FieldValue.delete`**: import from `firebase-admin/firestore` in API routes. Use `increment(1)` for `assignmentCount` when marking done, `delete()` to remove `assigned_volunteer_id` when reopening a need.
- **`increment` in client components**: import from `firebase/firestore` (client SDK), not admin.
- **Overlay z-index**: all modals and drawers use `z-[9999]` — Leaflet map controls sit at z-index 1000.
- **onSnapshot cleanup**: always return the unsubscribe function from `useEffect`. Both `needs` and `volunteers` collections are subscribed in a single effect in `Dashboard.tsx`.
- **`NEXT_PUBLIC_TEST_MODE`**: read at build time (Next.js inlines `NEXT_PUBLIC_` vars). The escalation route reads `process.env.NEXT_PUBLIC_TEST_MODE` at request time on the server — this works because the value is baked in at build.

## Environment variables

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_SERVICE_ACCOUNT_KEY        # full service account JSON as a single line
GEMINI_API_KEY
GEMINI_MOCK                         # "true" = keyword mock, no API calls
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM                # format: whatsapp:+14155238886
COORDINATOR_PHONE                   # receives escalation alerts, format: +91XXXXXXXXXX
NEXT_PUBLIC_TEST_MODE               # "true" = 1-min escalation / 30s poll; "false" = 10-min / 60s
ADMIN_SECRET                        # required as x-admin-secret header for /api/fix-phones
```
