# Build brief: shared apartment booking app

## What this is
A small private web app for a flat shared 50/50 by two couples. Purpose: book dates, see who's there, and make double-booking impossible. UX reference: a two-month calendar with colour-coded booking bars plus an "upcoming bookings" list (Airbnb-availability style). UI is in **Icelandic**.

## How to proceed
Before writing app code: set up the Supabase schema and propose a short build plan (schema + screens), then confirm with me. Then build. Don't over-engineer — this is a 4-person personal app, not a product.

## Stack (all free tier)
- **Frontend:** Vite + React + TypeScript. Mobile-first — this will mostly be used on phones.
- **Backend / DB / Auth:** Supabase (Postgres + magic-link email auth).
- **Hosting:** Vercel.
- **Notification email:** Resend.

## Auth
- Passwordless **magic-link** login. Session persists on the device (log in once per phone).
- **Two accounts, one per couple.** Only allowlisted emails may log in; reject everyone else.
- Allowlist (fill in):
  - Couple A — **"Svenni & Inga"**: `<email(s)>`
  - Couple B — **"Freyr & Sóley"**: `<email(s)>`
- The app maps each logged-in email → its couple (A or B). Store this mapping.

## Booking labels (4, fixed colours)
| Label | Colour | Meaning |
|---|---|---|
| Svenni & Inga | blue | Couple A stay |
| Freyr & Sóley | green | Couple B stay |
| Saman | red | Both couples there together |
| Aðrir gestir | amber/grey | Other guests, no owners present |

When creating a booking, the label **defaults to the logged-in couple**. The user can change it (e.g. to Saman or Aðrir gestir). The colour is driven by the label, not by who created it.

## Booking rules
- A booking = `start_date` (check-in), `end_date` (check-out), `label`, and `booked_by_couple` (A or B — always taken from the logged-in account, even when the label is Saman or Aðrir gestir), plus an optional free-text `notes` (e.g. who the other guests are, arrival time, "bringing the dog").
- **Exclusive occupancy.** No two bookings may overlap. Hard block — if proposed dates overlap an existing booking, reject with a clear Icelandic error. This applies to **all** labels (Saman is a single booking covering the dates; both couples present is still one booking that blocks everyone else).
- **Check-out day is free for the next person.** Model dates as a half-open range `[start_date, end_date)` so back-to-back bookings that share a single boundary day do **not** count as a conflict. Nights = `end_date − start_date`. (This matters — get it right; the reference shows consecutive stays touching on the same day.)
- **First-come-first-served.** No approval flow. No peak-period or fairness rules in v1.
- **Anyone logged in can create, edit, or delete any booking.** Login exists to prevent *accidental* edits, not to lock couples out of each other's bookings. Require a confirm step on delete.
- Editing a booking's label in place is allowed (e.g. a solo stay becomes Saman when the other couple decides to join).

## Screens / UI (Icelandic)
- **Title:** apartment name — placeholder, default `Íbúðin` (fill in).
- **Calendar:** two months side by side (current + next), navigable back/forward. Weekday headers `Mán Þri Mið Fim Fös Lau Sun` (week starts Monday). Each booking renders as a coloured bar spanning its dates, labelled with the booking name. Match the reference look reasonably — clean, readable on a phone.
- **Komandi bókanir** (upcoming bookings) list below the calendar: each row shows a coloured dot, the label name, the date range, and nights — e.g. `5. júní – 7. júní (2 nætur)` / `12. júní – 13. júní (1 nótt)` — with a delete (×) control. Singular/plural: `1 nótt` vs `N nætur`. If a booking has a note, show it on the row (or on tap).
- **New booking:** pick label (pre-selected to your couple), pick start + end dates, add an optional note, save. On overlap, show a clear Icelandic message naming the conflicting dates.
- Icelandic date formatting throughout (`5. júní`, etc.).
- **Installable as a phone app (PWA):** add a web manifest, app name, and icon, and make it run full-screen, so "Add to Home Screen" (iOS Safari) / "Install app" (Android Chrome) gives a proper home-screen icon that launches like a native app. No App Store needed.

## Notifications (Resend)
- On every **new booking**, **cancellation**, and **date/label change**, email the **other** couple.
- Keep it short and in Icelandic: who booked, which label, the dates, and nights. The acting couple is known from login.

## Suggested data model
- `members` (allowlist): `email` (pk), `couple` (`A` | `B`), `display_name`.
- `bookings`: `id`, `start_date`, `end_date`, `label` (enum: `svenni_inga` | `freyr_soley` | `saman` | `adrir_gestir`), `booked_by_couple` (`A` | `B`), `notes` (nullable text), `created_by_email`, `created_at`, `updated_at`.
- Enforce no-overlap **at the database level** with a Postgres exclusion constraint on the half-open daterange `[start_date, end_date)` (`EXCLUDE USING gist`), in addition to the app-level check, so a race can't create a conflict.
- Lock down access with Supabase RLS so only allowlisted/authenticated users can read or write.

## I'll provide / fill in
- Supabase project URL + anon key (env vars).
- Resend API key + verified sender domain/address (env vars).
- The allowlisted emails per couple.
- Apartment name for the title.

## Out of scope for v1
- Peak-period fairness or quotas — handled socially for now. (The `booked_by_couple` field is recorded so this can be added later without a migration; Saman stays naturally don't count against either couple.)
- Payments, cleaning schedules, guest messaging, recurring bookings.
