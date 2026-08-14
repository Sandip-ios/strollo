# Strollo

Premium dog walking platform. Next.js (App Router, TypeScript) full-stack, Postgres + Prisma, Razorpay, S3.

## Setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL at minimum to run locally
npm run prisma:generate
npm run prisma:migrate    # creates tables from prisma/schema.prisma
npm run dev
```

Requires a Postgres database (local, Docker, or hosted e.g. Supabase/Neon/Railway).

## Architecture

Modular monolith — one Next.js app, but domain modules under `src/modules/*`
each own their routes, services, and validation, so any module can be
extracted into its own service later without touching the others.

```
src/
  app/            → Next.js routes (pages + API routes)
  lib/            → shared utilities (prisma client, constants, auth helpers)
  modules/        → domain logic per feature (auth, dogs, bookings, walks, ...)
  components/     → shared UI components
prisma/
  schema.prisma   → full data model, grouped by module with comments
```

## Locked Product Decisions (v1)

These were confirmed during planning — noted here so they don't get
re-litigated by accident later:

- **OTP:** static test code `123456` accepted for all logins. Real SMS
  provider integration deferred; `OtpRequest` table already exists so
  swapping in a provider later is additive, not a rewrite.
- **Plans:** every active `Plan` is shown in the booking UI, gated by
  `dogQuantity` (a customer only sees plans matching how many dogs they
  selected). Admins can also create unlimited **custom** plans beyond the
  fixed Monthly/Weekly slots (`PlanType.CUSTOM`). The `TRIAL` plan type is
  deprecated — kept in the enum only so old rows/migrations stay valid,
  unreachable from any current UI or API path.
- **Billing cycle:** exactly 1 calendar month from `startDate`
  (e.g. start 4th → end 3rd of next month), extended by any carried-forward
  days from cancelled walks on a previous booking (see `carriedOverDays` on
  `Booking`). See `getMonthlyPlanEndDate()` in `src/lib/constants.ts`.
- **Holidays:** Sunday — no walk instances are generated for Sundays.
  See `generateWalkDates()` in `src/lib/constants.ts`.
- **Cancellation:** a customer **can** cancel an individual day's walk up to
  `CANCELLATION_LEAD_HOURS` (8h) before its slot starts; that day is
  credited toward the customer's next booking's duration. See
  `WalkStatus.CANCELLED`, `canCancelWalk()`, and
  `/api/bookings/[id]/walks/[walkId]/cancel`. A customer still can't cancel
  their own whole booking — only an **admin** can reject/cancel a whole
  booking, which always comes with a refund calculation (see next point).
- **Booking approval, rejection, and cancellation:** a payment-confirmed
  booking (`CONFIRMED`) needs explicit admin approval (`APPROVED`) before a
  walker can be assigned — `/api/admin/bookings/[id]/approve`. From
  `CONFIRMED`/`APPROVED`/`WALKER_ASSIGNED`/`ACTIVE`, an admin can instead
  reject/cancel the booking via `/api/admin/bookings/[id]/cancel`
  (`BookingStatus.CANCELLED`), which:
  - Pro-rates the refund by remaining walk-days: each `SCHEDULED` walk is
    worth an equal fraction of `priceAtBooking`; already-completed/missed
    walks aren't refunded. See `src/lib/refund.ts`.
  - Issues the refund via Razorpay (`payments.refund`) **before** writing
    any DB changes — if Razorpay's call fails, nothing is written, so the
    booking never ends up marked cancelled/refunded without the money
    actually having moved.
  - Marks remaining `SCHEDULED` walks `CANCELLED` with `carriedForward:
    true` immediately, so they can never also be carried forward as a free
    credit on a future booking (that would double-pay the customer for the
    same days — once in cash, once in credit).
  - There's no partial "decline a walker's assignment" or dispute flow —
    cancellation is a single all-or-nothing admin action per booking.
- **Walker assignment:** manual, admin-only, and only once a booking is
  `APPROVED`. **No capacity/scheduling rules on purpose** — admin manages
  walker workload manually; the app doesn't warn about or block overlapping
  assignments. Once assigned, a walker logs each walk's details —
  start/complete times, pee/poo, up to 6 photos, notes, and a GPS route
  (`WalkInstance.routePath`) with distance derived server-side via
  Haversine (`src/lib/geo.ts`) — surfaced to both the customer and admin on
  the booking detail page. While a walk is `ON_GOING`, the walker's device
  also pushes periodic location pings (`/api/walker/walks/[id]/location`),
  polled by the customer's booking page (`LiveWalkStatus`, every 15s) to
  show a "walk in progress" live status with a link to the last known
  location on Google Maps — polling-based, not a websocket/animated map.
- **Invoicing:** downloadable PDFs are proper GST tax invoices, not plain
  receipts — seller details/GSTIN come from `src/lib/business.ts` (from the
  business's GST REG-06 certificate), tax is split into CGST+SGST
  (intra-state) or IGST (inter-state) based on the customer's address state
  vs. the business's registered state, computed backward from the
  GST-inclusive amount actually charged (`src/lib/gst.ts`). No amount-in-
  words line, no formal sequential invoice-number register (numbers are
  derived from the Razorpay payment ID) — fine for v1, worth revisiting for
  strict compliance at higher volume.
- **Email notifications:** every in-app `Notification` is mirrored to email
  via SMTP (`src/lib/email.ts`, `nodemailer`) if the customer has an email
  on file — works with any SMTP relay (Gmail, SendGrid, SES, Mailgun, ...).
  Not configured yet in this environment: unset `SMTP_*`/`EMAIL_FROM` env
  vars make it no-op with a console log instead of sending. No SMS/WhatsApp
  channel exists.
- **Addresses:** captured via a map picker (Google Maps/Places) to get
  `latitude`/`longitude` on every address, and gated by service-area
  coverage — see Service areas below.
- **Service areas:** an address can only be created/updated if its pincode
  is covered by an active `ServiceArea` (`src/lib/service-area.ts`). If zero
  `ServiceArea` rows exist at all, nothing is blocked — that's the
  bootstrapping state before an admin configures any coverage. Today there
  are none configured, so every pincode is currently allowed; adding one
  immediately starts enforcing coverage.
- **Storage:** S3-compatible bucket for dog photos and walk photos.
- **Deletes:** soft delete (`deletedAt`) everywhere — no hard deletes.
- **Region:** India only (Razorpay, ₹ pricing stored in paise as integers).

## Roadmap Status

| Phase | Module | Status |
|---|---|---|
| 0 | Scaffold + DB schema | ✅ Done |
| 1 | Auth (OTP signup/login/logout — customer, walker, admin) | ✅ Done |
| 2 | Customer profile + addresses (map picker, auto-fill from selected location) | ✅ Done |
| 3 | My Dogs | ✅ Done |
| 4 | Plans & pricing (admin) — fixed + unlimited custom plans, dog-quantity gating | ✅ Done |
| 5 | Booking flow + Razorpay — incl. per-day cancellation + carry-forward | ✅ Done |
| 6a | Admin: walkers | ✅ Done |
| 6b | Admin: customer list/management page — search, dogs/addresses/booking history per customer, activate/deactivate (blocks login) | ✅ Done |
| 6c | Admin: service areas — pincode-based coverage gates address creation; `/admin/service-areas` CRUD | ✅ Done |
| 7a | Admin: walker assignment | ✅ Done |
| 7b | Admin: booking approval, rejection & pro-rated-refund cancellation — `CONFIRMED` → `APPROVED` gate, plus `/api/admin/bookings/[id]/cancel` for reject/cancel with a real Razorpay refund | ✅ Done |
| 8 | Walk tracking — start/complete, pee/poo, notes, up to 6 photos, GPS route + distance, **live status while ON_GOING** (polling), surfaced to customer & admin | ✅ Done |
| 9 | Notifications center — bell icon (unread badge, dropdown preview, mark-read) in every header + full `/notifications` history page, shared across all three roles, **mirrored to email via SMTP** | ✅ Done |
| 10a | Booking history | ✅ Done |
| 10b | Invoices — **GST tax invoices** (CGST/SGST/IGST, seller GSTIN) via `@react-pdf/renderer`, `GET /api/bookings/[id]/invoice`, "Download receipt" on customer & admin booking detail | ✅ Done |
| 10c | Admin reports / analytics — `/admin/reports`: net-of-refunds revenue (6mo), bookings by status, plan popularity, walker leaderboard | ✅ Done |
| 11 | Marketing site — redesigned `/` landing page, `/about`, `/contact` (working form → email via `/api/contact`), `/privacy`, shared `SiteHeader`/`SiteFooter` with real office address/phone/email | ✅ Done |

All originally planned v1 phases, plus GST invoicing, reject/refund, live
tracking, email notifications, and the public marketing site, are now
complete. See "What's missing to launch" below for what's still needed
before this could go live with real users and real money.

## What's missing to launch

Every planned feature is built, but "feature-complete" isn't the same as
"ready for real users and real money." Grouped by how much it'd hurt if
skipped:

**Would cause real harm on day one**
- **OTP is hardcoded to `123456` for every login, no SMS provider wired
  up.** As shipped, anyone who knows a customer's, walker's, or the admin's
  mobile number can log into their account with no further verification.
  This is the single most important thing to fix before launch — `OtpRequest`
  already exists specifically so a real provider (MSG91, Twilio Verify,
  etc.) is an additive change, not a rewrite.
- **No Razorpay webhook.** Payment confirmation only happens via the
  client-side redirect calling `/api/bookings/[id]/verify` after checkout.
  If the customer's tab closes or their connection drops between Razorpay
  charging them and that call firing, Razorpay has their money but the
  booking stays `PENDING_PAYMENT` forever with no walk instances generated
  and no way for the customer to retry. A webhook endpoint that verifies
  and confirms server-side, independent of the client callback, closes this.
- **No rate limiting** on OTP request/verify or any other endpoint —
  combined with the hardcoded OTP above, this is a compounding risk.

**Real product/ops gaps**
- **No SMS/WhatsApp/push notifications.** Email is wired up (see above),
  but a customer without an email on file — or one who doesn't check it —
  has no way to learn their walk started or completed outside the app's
  bell icon. For a same-day service, SMS/WhatsApp is the higher-value
  channel to add next, not email.
- **Stale statuses that nothing ever sets.** `BookingStatus.EXPIRED` exists
  ("payment window lapsed") but no code ever transitions a booking there —
  an abandoned `PENDING_PAYMENT` booking sits in that state forever with no
  cleanup job. `NotificationType.WALK_REACHED` and `PLAN_EXPIRY_REMINDER`
  are declared and have icons wired up, but nothing ever creates one.
- **Invoice numbers aren't a formal sequential register.** They're derived
  from the Razorpay payment ID (`STR-XXXXXXXX`), which is unique but not a
  gapless incrementing sequence — some GST audit contexts expect the latter.
  Fine for v1 volume; revisit if that becomes a real compliance requirement.
- **No dispute/partial-decline flow on cancellation.** An admin can only
  cancel a booking outright (with its calculated refund) — there's no way
  to, say, decline just one remaining walk-day, or handle a customer
  disputing the refunded amount, without doing it manually outside the app.

**Table stakes before any real deployment**
- **Zero automated tests** anywhere in the repo.
- **No error monitoring** (Sentry or equivalent) or structured logging —
  right now the only visibility into a production error is the server
  console.
- **No CI/CD, staging environment, or documented prod deployment path** —
  `npm run dev` and a single `.env` is the whole story today.
- **No Terms of Service or signup consent flow.** A Privacy Policy now
  exists (`/privacy`, linked from every marketing page's footer) covering
  what's collected (phone, addresses, GPS routes, photos) and how it's
  used/shared — but there's still no Terms of Service, and no explicit
  "I agree" checkbox at signup. Worth a lawyer's review before real launch,
  same as the Privacy Policy itself.
- **No database backup/restore plan** documented for the Postgres instance.
- **Walker verification is just a stored ID photo** — no actual background
  check or verification workflow, just a field an admin can look at.

None of this blocks continuing to build — it's the checklist for the gap
between "works in a demo" and "safe to put in front of paying strangers."
