This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project Docs

Subscription Hub product planning lives in:

- [Product spec](docs/product/subscription-hub-product-spec.md)
- [Feature registry](docs/product/subscription-hub-feature-registry.md)
- [Architecture decisions](docs/product/decisions.md)
- [Master implementation plan](docs/superpowers/plans/2026-05-19-subscription-hub-master-plan.md)
- [CSV import implementation plan](docs/superpowers/plans/2026-05-19-csv-import-onboarding-plan.md)
- [Bobby competitive research](docs/research/bobby-competitive-research.md)
- [Market leadership roadmap](docs/product/market-leadership-roadmap.md)

## Getting Started

Create a local environment file:

```bash
cp .env.example .env
```

Prepare the local SQLite database:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Accounts

The app uses email/password accounts with database-backed sessions (scrypt
password hashing, httpOnly cookie, 30-day expiry, revocable server-side).
Every app page and server action requires a session.

The seed creates a demo account preloaded with sample data:

```text
demo@subhub.local / subhub-demo
```

New accounts created through `/signup` start with an empty workspace. Login
is rate limited (5 failed attempts locks the email for 15 minutes), every
change is captured in a per-user audit trail (shown as "Recent changes" on
the dashboard and "History" on each subscription), and `/settings` manages
your profile, timezone, reminder preferences, full JSON data export, and
permanent account deletion.

## Cancellation Workflow

Each subscription detail page has an action panel for cancellation: record
that you requested cancellation (with notes), generate a ready-to-send
support email draft, and mark the subscription canceled once the provider
confirms — which stops its future reminders. Price edits are tracked as
price-change history and surface as insights when a price rises.

## Budget And Insights

The `/budget` page tracks normalized monthly spend against an overall monthly
target and optional per-category targets, and projects real upcoming charges
(from each renewal date and cadence) over the next six months. Targets are
edited inline on the page; leaving a field empty clears that target.

The dashboard shows a compact budget progress widget plus deterministic
insights computed locally from your data:

- Annual renewals charging within the next 60 days.
- Subscriptions unused for 45+ days (based on the last usage date).
- Duplicate providers and overlapping categories (streaming, music, storage,
  news, gaming).

## Household And Shared Subscriptions

The `/household` page manages the people you share subscriptions with.
Members have roles (Adult, Member, Viewer) backed by a permission matrix in
`src/lib/household/permissions.ts`; adding a member with an email records an
invitation (delivery arrives with the email provider integration).

Each subscription detail page has a sharing editor supporting equal, fixed
amount, and percentage splits. The owner always pays the remainder, so splits
add up to the real bill. When anything is shared, the dashboard and budget
pages track your personal share (what you actually pay) alongside the gross
bill, and the household page totals what each member owes per month.

## Detected Subscriptions

The `/detected` page finds recurring charges in bank statement exports —
no bank connection needed. Paste or upload a transactions CSV (columns:
date, description, amount; dates in YYYY-MM-DD or DD/MM/YYYY) and the
detector groups charges by normalized merchant, infers the cadence
(weekly/monthly/yearly/custom interval), tolerates price changes, and scores
each candidate with confidence plus the transaction evidence.

You can also paste the text of a receipt, invoice, or renewal email and the
provider, amount, date, and cadence are extracted locally — no inbox
connection needed.

Everything passes through a review queue: accept creates a subscription with
reminders scheduled, candidates matching an existing subscription offer a
merge instead (never a duplicate), and dismissed candidates stay out of the
queue on future scans. A built-in sample bank export demonstrates the flow in
one click. Plaid and OAuth email scanning later become additional sources
feeding this same queue.

## Reminders, Email, And Calendar

Reminders are scheduled rows that a send job delivers. "Send due reminders
now" on `/notifications` (or `POST /api/jobs/send-notifications`, guarded by
`JOB_SECRET` for external schedulers) processes everything due: email
reminders go through the transport in `src/lib/email/provider.ts` and in-app
reminders are marked delivered. The job is idempotent. Setting
`RESEND_API_KEY` (and a verified `EMAIL_FROM`) switches email delivery from
the local log transport to real sending through Resend — no code change.

`/api/calendar` exports an auth-guarded `.ics` file of the next year of
projected charges plus trial cancel-by deadlines — the "Export calendar"
button on the subscriptions page downloads it for Google/Apple Calendar.

The send job also generates workspace alerts (deduped per month): budget
approaching/exceeded notifications, and a monthly review prompt when enabled
in settings. Failed email sends retry with capped exponential backoff before
being marked Failed, quiet hours in settings hold due reminders until they
end, trials carry a "worth keeping?" verdict prompt, each subscription can
schedule account-email/password maintenance nudges (passwords are never
stored), and onboarding is a live checklist computed from your data.

## CSV Import

The import flow is available at `/import/csv`. Users can download the template,
upload or paste CSV data, preview row-level validation and duplicate warnings,
then commit valid rows into their subscription list.

Template file:

- `public/templates/subscription-hub-import-template.csv`

Expected CSV columns:

```text
providerName,category,status,billingCadence,priceAmount,currency,renewalDate,trialEndDate,cancelByDate,cancelUrl,billingUrl,accountEmail,notes
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The repo is deploy-ready; the only manual prerequisite is a Postgres
database.

1. Create a Postgres database. Supabase free tier works (note: the linked
   Supabase account currently has two active free projects, which is the
   plan limit — pause one in the Supabase dashboard or upgrade). Neon or any
   hosted Postgres also works.
2. In `prisma/schema.prisma`, change `provider = "sqlite"` to
   `provider = "postgresql"`.
3. Put the pooled connection string in `.env` as `DATABASE_URL` and run
   `npm run db:push` (add `npm run db:seed` if you want the demo workspace).
4. Import the GitHub repo at [vercel.com/new](https://vercel.com/new) —
   `postinstall` runs `prisma generate` automatically, and `vercel.json`
   registers a daily cron (01:00 UTC) that delivers due reminders.
5. Set Vercel environment variables: `DATABASE_URL`, `CRON_SECRET` (protects
   the cron endpoint; Vercel sends it automatically), and optionally
   `RESEND_API_KEY` + `EMAIL_FROM` for real email and `JOB_SECRET` for
   external schedulers.
