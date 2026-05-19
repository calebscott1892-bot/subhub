# Subscription Hub Market Leadership Roadmap

Last updated: 2026-05-19

## Strategic Goal

Build the best subscription control center in the market by combining Bobby's simplicity, Rocket Money's discovery value, YNAB-like budget awareness, and a unique household/shared-cost layer.

## North Star

Monthly avoided waste per active user.

Supporting metrics:

- Number of active subscriptions tracked.
- Percentage of users with at least one trial protected.
- Number of renewal decisions made before charge date.
- Number of subscriptions canceled, downgraded, paused, or split.
- Total personal recurring spend made visible.
- Shared-cost dollars allocated.
- Detected subscriptions accepted from import/email/bank sources.

## Product Pillars

### 1. Total Visibility

Users can see every subscription in one place.

Capabilities:

- Manual add.
- CSV import.
- Email detection.
- Bank detection.
- Provider metadata.
- Search, filters, and status.

### 2. Renewal Defense

Users are warned before surprise charges.

Capabilities:

- Renewal reminders.
- Trial cancel-by reminders.
- Annual renewal warnings.
- Timezone-safe scheduling.
- Notification dedupe.
- Calendar export.

### 3. Action Center

Users can do something useful from each subscription page.

Capabilities:

- Cancel link.
- Billing portal.
- Support link.
- Change plan link.
- Generated support email.
- Cancellation requested state.
- Cancellation confirmation.
- Audit trail.

### 4. Spend Intelligence

Users understand which subscriptions matter.

Capabilities:

- Monthly and yearly normalized spend.
- Category budgets.
- Spending trends.
- Price-change history.
- Duplicate detection.
- Underuse prompts.
- Forecasted costs.
- AI scripts and alternatives later.

### 5. Shared Cost Control

Users can manage the subscriptions they do not pay for alone.

Capabilities:

- Shared subscription flag.
- Household members.
- Split rules.
- Personal versus gross spend.
- Payment reminders.
- Pools.
- Stripe settlement later.

## Competitive Attack Plan

### Beat Bobby

Bobby's core promise is simple manual tracking. We beat it by matching manual clarity, then adding action and assisted discovery.

Execution:

- Keep manual mode fast and private.
- Make the detail page action-oriented.
- Build CSV import early.
- Build a dedicated Trials page.
- Add household/shared-cost features before marketplace.

### Beat Rocket Money For Privacy-Conscious Users

Rocket Money wins on detection, but requires bank access and charges recurring premium fees.

Execution:

- Do not require bank linking.
- Offer email/CSV/screenshot import as lower-risk detection.
- Use Plaid as optional, clearly permissioned, read-only infrastructure.
- Make pricing transparent and tied to money saved.

### Beat Budgeting Apps For Subscription-Specific Decisions

Budget apps show categories, but they rarely help users cancel, split, trial-track, or negotiate a subscription.

Execution:

- Stay subscription-native.
- Show budget pressure only as it relates to recurring commitments.
- Make renewal decisions the core workflow.

## Release Sequence

### Release 0.1: Manual Control Center

Goal: Beat Bobby's basic dashboard on web.

Must include:

- Real persisted subscription CRUD.
- Dashboard KPIs.
- Search/filter/sort list.
- Detail action panel.
- Trial fields.
- Basic settings.

### Release 0.2: Renewal Defense

Goal: Make the app materially useful before money leaves the account.

Must include:

- Trial page.
- Notification scheduler.
- In-app notifications.
- Email reminders.
- Timezone handling.
- Dedupe.

### Release 0.3: Import And Cleanup

Goal: Reduce setup friction Bobby cannot solve.

Must include:

- CSV template.
- Upload, preview, and commit.
- Duplicate detection.
- Suggested cleanup checklist.
- Cancellation requested tracking.

### Release 0.4: Subscription Budget

Goal: Connect recurring commitments to monthly pressure.

Must include:

- Budget overview.
- Category targets.
- Spending trend.
- Forecast.
- Overspending alerts.

### Release 0.5: Shared Costs

Goal: Own the household/family use case.

Must include:

- Household.
- Members.
- Split rules.
- Personal versus gross spend.
- Shared subscription filters.

### Release 0.6: Assisted Detection

Goal: Find what users forgot.

Must include:

- Detected subscription queue.
- Email import.
- Plaid import.
- User review before add.
- Evidence and confidence display.

## Immediate Engineering Next Step

Build Release 0.1 persistence.

Recommended stack decision for the next pass:

- Prisma.
- SQLite for local development first, with Postgres-compatible schema discipline.
- Next route handlers or server actions after checking the local Next 16 docs.
- Passwordless/demo auth only if full auth would slow product validation; otherwise use a proven provider.

The next code pass should produce:

- `prisma/schema.prisma`.
- `src/lib/db/*`.
- Persistent subscription repository.
- Route handlers or server actions for create/update/delete.
- Tests around validation and ownership checks.
- UI wired to real data instead of `sample-data.ts`.

