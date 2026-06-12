# Architecture Decisions

Last updated: 2026-06-12. These answer the "Open Decisions Before Coding"
list in the master plan. Guiding principle: every feature must run and be
testable fully offline with zero external accounts; paid providers slot in
behind existing abstractions when credentials exist.

## Auth provider

**Decision: own email/password auth.** Node `crypto.scrypt` password hashing
(salted, parameterized), opaque random session tokens stored hashed (SHA-256)
in a `Session` table, delivered as an httpOnly `subhub_session` cookie
(SameSite=Lax, Secure in production, 30-day expiry). No JWT and no secret to
manage; sessions are revocable server-side. If OAuth providers are wanted
later, Auth.js can wrap this user table without throwing the model away.

## Database provider

**Decision: SQLite for local development, Postgres-shaped schema.** Prisma
keeps the schema portable; switching to hosted Postgres (Supabase/Neon) is a
datasource change plus migration run. No code change expected because all
data access goes through repositories.

## Email provider

**Decision: transport abstraction now, Resend later.** `src/lib/email/provider.ts`
defines an `EmailTransport` interface. The default local transport records
messages to the server log and marks notifications sent. A Resend adapter is
the documented production choice (single API call, generous free tier) once
an API key exists in `.env` as `RESEND_API_KEY`.

## Job runner strategy

**Decision: idempotent job functions + on-demand triggers.** Jobs live in
`src/lib/notifications/send.ts` style functions that take `now` as input and
are safe to re-run. They are triggered by a button in the UI (server action)
and by `POST /api/jobs/send-notifications` guarded by `JOB_SECRET` when set,
which works with Vercel Cron or any external scheduler later. No queue
infrastructure until volume demands it.

## Charting library

**Decision: none.** Hand-rolled SVG/CSS bars (see `/budget`) keep the bundle
small and the rendering server-side. Revisit only if interactive charts are
required.

## Form and validation stack

**Decision: native FormData + parse functions in `src/lib/*/validation.ts`.**
Server-rendered forms posting to server actions, validation as pure tested
functions returning `{ ok, data | errors }`. No client form library.

## Server actions vs route handlers

**Decision: server actions for user-driven mutations, route handlers only for
machine endpoints** (job triggers, calendar/ICS export, future webhooks).
Every server action authenticates via the session before touching data.

## Bank and email detection

**Decision: source-agnostic detection pipeline, CSV first.** Recurring-charge
detection runs locally over transactions pasted/uploaded from bank CSV
exports — no Plaid account needed. Candidates carry evidence and confidence
and always pass through a review queue (accept / merge / dismiss); nothing is
added without user confirmation. Plaid and Gmail/Outlook OAuth later become
additional transaction/evidence sources feeding the same queue, gated as an
opt-in connection.

## Marketplace

**Decision: deferred behind trusted contacts.** Marketplace and split
payments (Stripe Connect) stay unbuilt until the core product is deployed and
a Stripe account exists. When built, it starts with household/trusted
contacts only, not public listings.
