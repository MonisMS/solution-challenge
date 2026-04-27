# Architecture

A technical reference for the codebase. Covers data flow, modules, and the design decisions worth remembering.

---

## High-level data flow

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│ Field worker│      │ NGO          │      │ Volunteer   │
│ (WhatsApp)  │      │ coordinator  │      │ (WhatsApp)  │
└──────┬──────┘      └──────┬───────┘      └──────┬──────┘
       │ 1. Field report     │                    │
       │   (text + video)    │                    │
       ▼                     ▼                    │
┌──────────────────────────────────────────┐     │
│  Next.js API routes (Vercel)             │     │
│   /api/whatsapp/incoming                 │     │
│   /api/needs                             │◄────┘
│   /api/whatsapp/notify                   │  4. Status reply
│   /api/needs/escalate                    │
│   /api/needs/brief                       │
└────────────┬─────────────────────────────┘
             │  2. Extract → write
             ▼
       ┌─────────────┐         ┌──────────────────┐
       │  Firestore  │ ◄──────►│ Dashboard (Vercel)│
       │             │ on      │  React 19         │
       │  needs/     │ Snapshot│  Leaflet map      │
       │  volunteers/│         │  Real-time UI     │
       │  notifications/       │                  │
       └─────────────┘         └────────┬─────────┘
                                        │ 3. Assign
                                        ▼
                               ┌──────────────────┐
                               │  Twilio WhatsApp │
                               └──────────────────┘
```

---

## Core flows

### 1. Field report intake (`/api/whatsapp/incoming`)

Twilio POSTs `application/x-www-form-urlencoded` with `Body`, `From`, optional `MediaUrl0`/`MediaContentType0`.

```
parse formData
  → normalize phone
  → handleVolunteerReply()  ← if sender is a registered volunteer with active assignment, route to status-update flow
  → else: extractNeed(body) via Gemini 2.0 Flash
  → resolveWard(location)   ← fuzzy-match Hindi/English ward names → lat/lng
  → write to Firestore: needs/{id}
  → write notification doc
  → send auto-reply WhatsApp
  → return TwiML 200 (always — non-200 triggers Twilio retries)
```

Video media is captured by checking `MediaContentType0?.startsWith('video/')` and stored as `video_url` on the need.

### 2. Volunteer reply detection (same endpoint)

When a registered volunteer with an active assignment replies, the message body is regex-matched in Hindi + English:

| Pattern | Action |
|---|---|
| `eta\s*(\d+)\s*min` | Set `volunteer_eta` |
| `on my way / nikal / coming` | Set `volunteer_eta = 'En route'` |
| `arrived / pahuncha / here` | Set `volunteer_eta = 'On site'` |
| `done / kaam khatam` | `status = 'resolved'`, free volunteer |
| `can't / nahi / unable` | `status = 'open'`, free volunteer, clear assignment |
| anything else | Log as `volunteer_reply`, send help message |

### 3. Assignment (PATCH `/api/needs`)

All side-effects happen server-side via the Admin SDK in a single Firestore batch:

| Transition | Volunteer side-effect |
|---|---|
| `→ assigned` (new ID) | Lock new volunteer (`available=false`, `assignmentCount++`); free old volunteer if reassign |
| `→ resolved` | Free assigned volunteer |
| `→ open` (after assigned) | Free volunteer; clear `assigned_volunteer_id`, `volunteer_eta`, `volunteer_reply` |

This is why Firestore rules can deny all client writes — the dashboard never writes directly. See [`app/api/needs/route.ts`](./app/api/needs/route.ts).

### 4. Escalation polling (`/api/needs/escalate`)

The dashboard hits this endpoint every 30s (test mode) or 60s (production). The endpoint:

1. Queries `needs` where `severity == 'critical'` AND `status == 'open'` AND `created_at < now - threshold`
2. Filters to those without `escalated == true`
3. For each: marks `escalated: true`, `escalated_at: now`; sends a WhatsApp to `COORDINATOR_PHONE`

Threshold: 1 minute when `NEXT_PUBLIC_TEST_MODE=true`, otherwise 10 minutes.

### 5. Volunteer matching (`lib/matching.ts`)

```
score = 0.5 × proximity + 0.3 × skill + 0.2 × availability
```

- **proximity**: `max(0, 1 − distKm / 10)` — Haversine; score = 0 beyond 10 km
- **skill**: `1` if volunteer skills include the need type, else `0`
- **availability**: `1` if available, else `0`

`getTopMatches(need, volunteers, n)` returns the top-n available volunteers ranked by score.

---

## Module map

```
app/
  layout.tsx                          # Root, fonts, metadata
  page.tsx                            # Dashboard host (Server Component → <Dashboard/>)
  globals.css                         # Light theme, mesh gradient, animations, Leaflet overrides
  profile/[id]/page.tsx               # Server Component — fetches volunteer via Admin SDK
  volunteers/page.tsx                 # Self-registration page
  api/
    whatsapp/incoming/route.ts        # Twilio inbound webhook (TwiML response, always 200)
    whatsapp/notify/route.ts          # Outbound sender (sendWhatsApp helper)
    needs/route.ts                    # GET all + PATCH (server-side volunteer side-effects)
    needs/brief/route.ts              # Gemini situation summary
    needs/escalate/route.ts           # Escalation poller, called by client
    notifications/route.ts            # GET recent + PATCH mark-as-read
    volunteers/route.ts               # GET all + POST register
    seed/route.ts                     # Seed 12 demo volunteers (idempotent)
    fix-phones/route.ts               # Admin: bulk update phones (x-admin-secret header)

components/
  Dashboard.tsx                       # Master state: needs, volunteers, notifications,
                                      # selectedNeed, assignTarget, contactTarget, panels.
                                      # Wires onSnapshot listeners + escalation polling.
  Toast.tsx                           # Bottom-right toast (auto-dismiss after 4s)

  layout/
    IconRail.tsx                      # 56px slim left rail with icon-only nav

  map/
    NeedMap.tsx                       # Leaflet map (CartoDB Voyager light tiles).
                                      # Custom markers: white circle + severity-colored
                                      # border + icon, pulse ring for critical/high.
    MapControls.tsx                   # Custom zoom in/out/reset (replaces Leaflet defaults)
    StatsPanel.tsx                    # Editorial situation overview, area sparkline
    NeedContextCard.tsx               # Floating glass card on marker click;
                                      # bottom-sheet on mobile, right-aligned on desktop

  needs/
    NeedCard.tsx                      # Compact list row — severity bar + meta + quote
    NeedList.tsx                      # Tabbed (Open/Assigned/Resolved) editorial list
    NeedDetail.tsx                    # Full alert detail: hero, pull-quote report,
                                      # assigned-volunteer card, responders list

  volunteers/
    VolunteerCard.tsx                 # Search row → /profile/[id]
    VolunteerList.tsx                 # Searchable, available-only filter

  notifications/
    NotificationBell.tsx              # Bell + dropdown (auto-marks-read on open)
    AlertToast.tsx                    # Top-right popup for new critical/high needs

  dialogs/
    AssignConfirmDialog.tsx           # Confirm assignment with editable WhatsApp message
    ContactVolunteerDialog.tsx        # Send custom WhatsApp to assigned volunteer;
                                      # quick-reply chips
    SituationBriefModal.tsx           # Gemini summary modal
    VolunteerDrawer.tsx               # Add-volunteer slide-in: 3 numbered sections,
                                      # live avatar preview

  profile/
    VolunteerProfilePage.tsx          # Editorial 2-column profile (no boxes, dividers)

  video/
    VideoModal.tsx                    # Fullscreen HTML5 video player (ESC to close)

  ui/
    Avatar.tsx                        # Gradient avatar from initials (8 gradient palettes)
    Badge.tsx                         # SeverityBadge / StatusBadge / SkillBadge / LangBadge

lib/
  types.ts                            # CommunityNeed, Volunteer, NeedExtraction, AppNotification
  firebase.ts                         # Client SDK singleton (browser, onSnapshot)
  firebase-admin.ts                   # Admin SDK singleton (server, API routes)
  gemini.ts                           # extractNeed() + parseGeminiJson() + mockExtract() fallback
  twilio.ts                           # sendWhatsApp() wrapper (lazy-init Twilio client)
  matching.ts                         # haversineKm(), scoreVolunteer(), getTopMatches()
  wards.ts                            # 25 Mumbai wards + alias map + resolveWard() fuzzy lookup
```

---

## Two Firebase SDKs — never mix them

| File | Purpose | Where it's used |
|---|---|---|
| `lib/firebase.ts` | **Client SDK** — `onSnapshot`, real-time listeners | `'use client'` components only |
| `lib/firebase-admin.ts` | **Admin SDK** — bypasses security rules, full access | API route handlers only (`app/api/`) |

The dashboard subscribes via the client SDK for real-time UX. All writes go through API routes via the Admin SDK, so Firestore security rules can lock down all client writes (`allow write: if false`).

---

## Real-time architecture

The dashboard maintains three Firestore snapshot listeners:

```typescript
onSnapshot(collection(db, 'needs'),         setNeeds)
onSnapshot(collection(db, 'volunteers'),    setVolunteers)
onSnapshot(collection(db, 'notifications'), setNotifications)
```

When a new critical/high need arrives, the dashboard diffs against `prevNeedIds` and shows an `AlertToast` — animated slide-in with "View & Assign" CTA.

---

## Critical implementation rules

1. **Twilio webhook**: parse with `request.formData()` (not JSON — Twilio uses `application/x-www-form-urlencoded`). Always return HTTP 200 with `<?xml version="1.0"?><Response></Response>` even on errors — non-200 triggers retries and creates duplicate needs.

2. **`FieldValue.increment` / `FieldValue.delete`**: import from `firebase-admin/firestore` in API routes. Don't use the client equivalents on the server.

3. **`onSnapshot` cleanup**: always return the unsubscribe function from `useEffect`.

4. **`NEXT_PUBLIC_TEST_MODE`**: read at build time (Next.js inlines `NEXT_PUBLIC_*`). The escalation route reads it at request time, which works because the value is baked in.

5. **Map**: import `<NeedMap>` with `dynamic(() => import('./map/NeedMap'), { ssr: false })`. Leaflet touches `window` and breaks SSR.

6. **Profile page**: it's a Server Component (`app/profile/[id]/page.tsx`) that fetches via the Admin SDK and renders a Client Component (`VolunteerProfilePage`).

---

## Design system

### Colors

```css
--bg-base:       #f8fafc        /* Body */
--bg-surface:    #ffffff        /* Cards */
--bg-card-soft:  #f8fafc        /* Subtle inset */
--border:        #e2e8f0        /* Dividers */
--text-primary:  #0f172a        /* Headlines */
--text-secondary:#475569        /* Body */
--text-muted:    #94a3b8        /* Labels */
--accent:        #3b82f6        /* Blue */
--lime:          #c5f548        /* Primary CTA */
```

### Severity palette

| Severity | Color | Tailwind text | Tailwind bg |
|---|---|---|---|
| critical | `#ef4444` | `text-red-600` | `bg-red-500` |
| high     | `#f97316` | `text-orange-600` | `bg-orange-500` |
| medium   | `#f59e0b` | `text-amber-600` | `bg-amber-500` |
| low      | `#10b981` | `text-emerald-600` | `bg-emerald-500` |

### Animations

```css
--ease-spring: cubic-bezier(0.16, 1, 0.3, 1)   /* Spring-like */
--ease-out:    cubic-bezier(0.32, 0.72, 0, 1)  /* Smooth out */
--ease-snap:   cubic-bezier(0.4, 0, 0.2, 1)    /* Material */
```

Reusable keyframes in `globals.css`:
- `marker-ping` — 1.8s pulse ring on critical/high markers
- `float-in` — 360ms scale + fade for floating cards
- `slide-in-right` — 400ms for desktop context card
- `slide-up` — 380ms for mobile bottom-sheet context card

### Background

A 4-stop radial mesh gradient (lavender → amber → sky-blue → pink) plus an SVG noise texture overlay (multiply blend) on `body::before`. The texture is disabled on mobile to save GPU.

---

## Mobile responsiveness

| Breakpoint | Layout shift |
|---|---|
| `< sm` (640px) | Top bar collapses to icon-only buttons; filter pill is icon-only; "Add" replaces "Add Volunteer" |
| `< md` (768px) | Side panel takes most of the viewport (`calc(100vw - 3.5rem)`); map zoom controls hidden; context card becomes a bottom sheet with drag handle; mobile backdrop closes panel/sheet on tap |
| `< md` profile page | Hero stacks (avatar on top, name/role below); 3-column grid → 1-column |

Selecting a marker on mobile auto-closes any open side panel so the bottom sheet has the spotlight.

---

## Security model

- **Firestore rules**: `read: true; write: false` — all writes go through API routes
- **Admin SDK**: the server uses `FIREBASE_SERVICE_ACCOUNT_KEY` to bypass rules
- **`/api/fix-phones`** requires `x-admin-secret` header matching `ADMIN_SECRET`
- **Twilio webhook**: not signature-verified yet (TODO for production); the `From` field is trusted

For production deployment, add Twilio request signature validation to `/api/whatsapp/incoming`.

---

## What's not in scope (yet)

- Multi-volunteer assignment (current model is 1:1)
- Volunteer-side mobile app (volunteers use WhatsApp only)
- Push notifications (relies on WhatsApp)
- Authentication for the coordinator dashboard
- Internationalization beyond ward-name fuzzy-matching
- Live video streaming (current model: upload + preview + modal playback)
