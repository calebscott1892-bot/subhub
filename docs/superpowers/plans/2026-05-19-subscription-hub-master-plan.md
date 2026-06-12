# Subscription Hub Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Subscription Hub from a fresh Next.js scaffold into a secure subscription tracking, budgeting, sharing, detection, and marketplace product over multiple deliverable passes.

**Architecture:** Ship the manual subscription hub first, then layer budgets, sharing, detection, AI, and marketplace systems behind explicit user review flows. Use a relational domain model with audited changes, deduped notification scheduling, and backend-only handling for bank, email, payment, and provider tokens.

**Tech Stack:** Next.js 16.2.6 App Router, React 19, TypeScript, Tailwind 4, Postgres, Prisma or equivalent ORM, auth provider to be selected, email provider to be selected, scheduled jobs, Plaid, Gmail/Outlook OAuth, Stripe for later marketplace payments.

---

## Required Repo Rule

`AGENTS.md` says this is not a familiar Next.js version. Before writing application code, read the relevant guide in `node_modules/next/dist/docs/` for the API or convention being touched.

This master plan intentionally splits the Base44 transcript into separate implementation passes. Before executing each pass, create a detailed task plan for that pass with exact file paths, tests, and commands.

## Current Repo Baseline

- Next.js `16.2.6`
- React `19.2.4`
- TypeScript
- Tailwind `4`
- Source app currently contains the default scaffold under `src/app`.
- No database, auth, tests, or product code yet.

## Documentation Created

- `docs/product/subscription-hub-product-spec.md`
- `docs/product/subscription-hub-feature-registry.md`
- `docs/superpowers/plans/2026-05-19-subscription-hub-master-plan.md`

## Pass 0: Product Capture And Repo Orientation

- [x] Capture the Base44 transcript into durable product documentation.
- [x] Normalize repeated requests into a feature registry.
- [x] Identify MVP, V1, and later scope.
- [x] Preserve security and privacy requirements.
- [x] Preserve banking, email, AI, marketplace, payment, household, and community roadmap items.
- [ ] Decide first implementation slice with the project owner.

Acceptance:

- Product vision is not dependent on chat history.
- Future agents can understand scope by reading `docs/product`.

## Pass 1: MVP Foundation

Purpose: Create a production-shaped manual subscription tracker without external integrations.

Deliverables:

- Auth-protected app shell.
- First-run onboarding.
- Database schema and migrations.
- User profile and settings.
- Subscription CRUD.
- Cost normalization utilities.
- Renewal date utilities.
- Seed data.
- Basic tests.

Key files likely to be created or modified:

- `package.json`
- `.env.example`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/onboarding/page.tsx`
- `src/app/(app)/subscriptions/page.tsx`
- `src/app/(app)/subscriptions/new/page.tsx`
- `src/app/(app)/subscriptions/[id]/page.tsx`
- `src/lib/subscriptions/costs.ts`
- `src/lib/subscriptions/dates.ts`
- `src/lib/subscriptions/schema.ts`
- `src/lib/auth/*`
- `prisma/schema.prisma` or equivalent ORM schema
- `prisma/seed.ts`
- `src/__tests__/subscriptions/*`

Critical tests:

- Monthly, yearly, weekly, and custom cost normalization.
- Month-end renewal date calculation.
- Missing renewal date handling.
- Auth-protected subscription APIs.

## Pass 2: Trials And Notifications

Purpose: Prevent forgotten trial conversions and unwanted renewals.

Deliverables:

- Trial-specific fields and UI.
- Dedicated `/trials` page.
- Notification settings.
- Notification scheduling logic.
- In-app notification center.
- Email sending provider abstraction.
- Background job runner.
- Deduped notification tests.

Key files likely to be created or modified:

- `src/app/(app)/trials/page.tsx`
- `src/app/(app)/notifications/page.tsx`
- `src/app/(app)/settings/page.tsx`
- `src/lib/notifications/schedule.ts`
- `src/lib/notifications/send.ts`
- `src/lib/notifications/dedupe.ts`
- `src/lib/email/provider.ts`
- `src/jobs/send-notifications.ts`
- `src/__tests__/notifications/*`

Critical tests:

- Trial reminders at 7 days, 2 days, and morning of cancel-by.
- Renewal reminders at configured lead times.
- Dedupe key uniqueness.
- Timezone-safe scheduled times.
- Notification replacement when a renewal date changes.

## Pass 3: CSV Import And Onboarding

Purpose: Make it fast for users to add their current subscriptions.

Deliverables:

- Welcome/onboarding wizard.
- Manual add shortcuts.
- Sample data option.
- Personalized checklist.
- Contextual guidance for future marketplace concepts.
- CSV template.
- CSV upload, validation, preview, and commit flow.
- Duplicate warnings.

Key files likely to be created or modified:

- `src/app/(app)/onboarding/page.tsx`
- `src/app/(app)/import/csv/page.tsx`
- `src/lib/import/csv-template.ts`
- `src/lib/import/parse-csv.ts`
- `src/lib/import/validate-import-row.ts`
- `src/lib/import/commit-import.ts`
- `public/templates/subscription-hub-import-template.csv`
- `src/__tests__/import/*`

Critical tests:

- Valid CSV rows produce preview records.
- Invalid rows return actionable errors.
- Commit does not run until preview is approved.
- Duplicate detection works against existing subscriptions.

## Pass 4: Budget Overview And Spending Trends

Purpose: Add financial management beyond tracking.

Deliverables:

- `/budget` overview page.
- Monthly and yearly targets.
- Category budgets.
- Spending progress charts.
- Spending trends.
- Forecast based on current recurring subscriptions.
- Dashboard budget widget.
- Overspending and approaching-limit alerts.

Key files likely to be created or modified:

- `src/app/(app)/budget/page.tsx`
- `src/lib/budget/calculate-budget.ts`
- `src/lib/budget/spending-trends.ts`
- `src/lib/budget/forecast.ts`
- `src/components/charts/*`
- `src/__tests__/budget/*`

Critical tests:

- Budget progress from active subscriptions.
- Personal versus shared spending calculations.
- Monthly and yearly period handling.
- Forecast respects billing cadence.

## Pass 5: Household And Split Subscriptions

Purpose: Support families, roommates, shared accounts, and personal cost responsibility.

Deliverables:

- Household model.
- Household invitations.
- Member roles and permissions.
- Shared subscription flags.
- Split rules: equal, fixed amount, percentage.
- Personal versus gross spend across dashboard and budget pages.
- Shared subscription management UI.

Key files likely to be created or modified:

- `src/app/(app)/household/page.tsx`
- `src/lib/household/permissions.ts`
- `src/lib/sharing/split-rules.ts`
- `src/lib/sharing/personal-cost.ts`
- `src/__tests__/sharing/*`

Critical tests:

- Equal split across members.
- Fixed amount split.
- Percentage split.
- Owner pays remainder behavior.
- Permission checks for view, add, edit, manage, and admin actions.

## Pass 6: Insights And AI Foundations

Purpose: Help users reduce subscription fatigue without requiring external data yet.

Deliverables:

- Last usage date field.
- Duplicate subscription detection.
- Annual renewal insight.
- Price change history.
- Underused subscription insight.
- AI-ready insights panel using deterministic local logic first.
- Manual override for categories.

Key files likely to be created or modified:

- `src/lib/insights/underused.ts`
- `src/lib/insights/duplicates.ts`
- `src/lib/insights/annual-renewals.ts`
- `src/lib/insights/price-changes.ts`
- `src/components/insights/*`
- `src/__tests__/insights/*`

Critical tests:

- Underused threshold logic.
- Duplicate provider/category detection.
- Annual renewal windows.
- Price increase severity.

## Pass 7: Bank And Email Detection

Purpose: Suggest subscriptions from financial transactions and email evidence, with user confirmation.

Deliverables:

- Plaid Link flow.
- Backend token exchange and encrypted token storage.
- Gmail OAuth connection.
- Outlook OAuth connection.
- Email and transaction scan jobs.
- Detected subscriptions review queue.
- Accept, reject, and merge flows.
- Evidence and confidence display.

Key files likely to be created or modified:

- `src/app/(app)/connections/page.tsx`
- `src/app/(app)/detected-subscriptions/page.tsx`
- `src/lib/plaid/*`
- `src/lib/email-detection/*`
- `src/lib/detection/confidence.ts`
- `src/lib/detection/merge.ts`
- `src/jobs/scan-transactions.ts`
- `src/jobs/scan-email.ts`
- `src/__tests__/detection/*`

Critical tests:

- Access tokens never reach the client.
- Detected candidates require user approval.
- Merge does not duplicate existing subscriptions.
- Email parsing extracts invoices, trial offers, renewal confirmations, and price-change notices.

## Pass 8: Marketplace And Shared Payments

Purpose: Let users opt in to subscription cost sharing with trust and payment tracking.

Deliverables:

- Marketplace listings.
- Search, filters, sorting, ratings, and reviews.
- Local discovery controls.
- Stripe payment collection and payout architecture.
- Payment reminders and status tracking.
- Owner and participant views.
- Abuse/reporting baseline.

Key files likely to be created or modified:

- `src/app/(app)/marketplace/page.tsx`
- `src/app/(app)/marketplace/[id]/page.tsx`
- `src/lib/marketplace/search.ts`
- `src/lib/marketplace/reviews.ts`
- `src/lib/payments/stripe.ts`
- `src/lib/payments/status.ts`
- `src/__tests__/marketplace/*`
- `src/__tests__/payments/*`

Critical tests:

- Listing permissions.
- Rating aggregate calculations.
- Search and filter behavior.
- Payment due, paid, failed, and overdue state transitions.

## Pass 9: Advanced AI, Provider APIs, Community, And Bill Pay

Purpose: Add higher-risk automation once the core product is trustworthy.

Deliverables:

- AI auto-categorization.
- AI negotiation scripts.
- AI cancellation and downgrade scripts.
- Cheaper alternative suggestions.
- Provider API integrations where available.
- Community discussion board.
- Curated subscription lists.
- Reputation system.
- Direct bill payment and automatic payments where feasible.

Critical constraints:

- AI recommendations require user review.
- Provider actions require explicit provider support and user authorization.
- Direct payments require a separate compliance and risk review.
- Community content needs moderation and abuse handling.

## Open Decisions Before Coding

Resolved 2026-06-12 — see `docs/product/decisions.md` for rationale:

- Auth provider: own scrypt + DB-session auth.
- Database provider: SQLite locally, Postgres-portable schema.
- Email provider: transport abstraction, local transport now, Resend later.
- Job runner strategy: idempotent job functions, UI trigger + secret-guarded route.
- Charting library: none, hand-rolled SVG/CSS.
- Form and validation stack: FormData + pure parse functions, server actions.
- Server actions for mutations, route handlers for machine endpoints.
- Marketplace starts trusted-contacts only, deferred until Stripe exists.
- Detection ships CSV-first and source-agnostic; Plaid/email are opt-in later sources.

## First Recommended Slice

Start with Pass 1 and Pass 2 together only if scope allows. Otherwise start with Pass 1.

The first useful demo should let a user:

- Sign up.
- Add a subscription.
- Add a trial.
- See normalized monthly and yearly spend.
- See the next renewal.
- Open the subscription detail page.
- Mark a cancellation requested.
- Receive or inspect scheduled reminder rows.
