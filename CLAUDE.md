# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: This is Next.js 16

This is **Next.js 16.2.4** — not the version in your training data. APIs, conventions, and file structure may differ. Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.

## Commands

```bash
pnpm dev        # start dev server
pnpm build      # production build
pnpm start      # start production server
pnpm lint       # run eslint
```

No test runner is configured yet.

## Project: NGO Community Needs + Volunteer Matching

A real-time coordination platform that turns WhatsApp field reports into actionable, mapped community needs and matches volunteers to tasks.

**Three users:**
- **Field worker (Rahul)** — sends free-text WhatsApp messages. Zero behavior change required.
- **NGO coordinator (Priya)** — uses the web dashboard to see live needs on a map and assign volunteers.
- **Volunteer (Arjun)** — receives WhatsApp notifications when matched to a task.

**Core data flow:**
```
WhatsApp message → Twilio webhook → /api/whatsapp/incoming
  → Gemini Flash (extracts: location, need_type, severity, affected_count as JSON)
  → Firebase Firestore (stores structured need)
  → Dashboard real-time listener (Firestore onSnapshot)
  → Volunteer matching score (proximity + skill + availability)
  → Twilio outbound WhatsApp → volunteer notification
```

## Planned Tech Stack (not yet installed)

| Package | Purpose |
|---|---|
| `firebase` | Firestore real-time DB |
| `@google/generative-ai` | Gemini Flash API for need extraction |
| `twilio` | WhatsApp inbound webhook + outbound notifications |
| `leaflet` + `react-leaflet` | Free map, no API key needed |

## Architecture

**App Router** with all routes under `app/`. API routes use the Route Handler convention (`app/api/.../route.ts`).

Planned structure:
```
app/
  page.tsx                        # Priya's dashboard (map + priority queue + volunteer panel)
  volunteers/page.tsx             # Volunteer self-registration form
  api/
    whatsapp/incoming/route.ts    # Twilio webhook receiver
    needs/route.ts                # CRUD for community needs
    volunteers/route.ts           # CRUD for volunteer roster
lib/
  gemini.ts       # Gemini Flash extraction — returns typed NeedExtraction object
  firebase.ts     # Firestore client (singleton)
  twilio.ts       # Send WhatsApp notification helper
  matching.ts     # Score volunteers: 0.5×proximity + 0.3×skill_match + 0.2×availability
  wards.ts        # Hardcoded ward → lat/lng map for demo city (do not use geocoding API)
```

## Key Implementation Rules

- **Ward geocoding**: Do not call a geocoding API for ward-level locations — Indian ward boundaries are inconsistent. Use the hardcoded lookup in `lib/wards.ts`.
- **Twilio sandbox**: Requires opt-in ("join [code]") per phone number. Pre-register all demo phones before presentation day.
- **Firebase rules**: Open rules are acceptable for demo; tighten before any production use.
- **Gemini prompt**: Must return strict JSON `{ location, need_type, severity, affected_count }`. Test with 15+ Hindi/English message variants before demo day — informal text without punctuation is the common case.
- **Path alias**: `@/*` maps to the repo root (configured in tsconfig).
