# Subscription Hub Product Spec

Last updated: 2026-05-19

## Purpose

Subscription Hub is an all-in-one subscription management app. It helps users track every recurring commitment they have, including paid subscriptions, free trials, household shares, split payments, SaaS tools, memberships, utilities, newsletters, and future marketplace shares.

The core promise is simple: users should know what they pay for, when they will be charged, what is shared, what is wasted, and what action they can take before money leaves their account.

## Product Principles

- Works without provider integrations. Many providers do not support programmatic cancellation, so the app must support deep links, guided cancellation steps, support email drafts, and manual status tracking.
- Never store provider passwords or full payment card details.
- Users review and confirm detected subscriptions before anything is added automatically.
- Manual entry must remain first-class, even after bank, email, AI, and provider integrations are added.
- Shared costs must be clear. The app should distinguish gross subscription cost from the user's personal responsibility.
- Warnings should be useful, not noisy. Notifications must be deduped and timezone-safe.
- The UI should feel calm, financial, and practical, with prominent warning states for trials and renewals.

## Target Users

- Individuals with 10 to 50 subscriptions.
- Families and households managing shared subscriptions.
- Roommates or trusted contacts splitting subscription costs.
- Small teams managing SaaS and digital services, as a later expansion.

## MVP Scope

The MVP must ship a complete manual subscription tracker.

- Email/password auth, with OAuth optional.
- Create, read, update, and delete subscriptions.
- Dashboard with total monthly spend, annual spend, active subscription count, trials ending soon, and next renewal.
- Trial tracking with trial start, trial end, cancel-by date, and expected post-trial price.
- In-app and email notifications for trial and renewal reminders.
- Subscription detail pages with cancellation, billing, support, and plan-management links.
- Subscription statuses: Active, Trial, Paused, Canceled, Expired.
- Cancellation tracking: cancellation requested date, cancellation notes, and confirmed canceled state.
- CSV import with upload, validation, preview, and commit.
- Search, filter, and sort across subscriptions.
- Settings for reminder preferences and timezone.
- Seed data and demo/sample mode.
- Tests for date calculations, notification dedupe, and authenticated API access.
- README and `.env.example` with local setup instructions.

## V1 Scope

V1 expands from manual tracking into assisted financial management.

- Bank transaction detection via Plaid or equivalent service.
- Email scanning via Gmail and Outlook OAuth for invoices, renewal notices, trial confirmations, and price-change notices.
- Suggested subscriptions inbox where users review, edit, accept, merge, or reject detected items.
- Price change tracking and alerts.
- Household sharing with invited members.
- Budget goals for total subscription spend and categories.
- Calendar export using ICS, with possible Google or Apple calendar flows later.
- More notification channels such as SMS and push.
- Manual usage tracking, including last usage date and review prompts.
- Monthly subscription review reminders.

## Later Scope

The later roadmap includes advanced automation, marketplace, AI, and community features.

- Provider APIs for plan, renewal, price, cancellation, upgrade, and downgrade actions where providers allow it.
- AI auto-categorization from subscription names, descriptions, email, and transaction data.
- AI insights for duplicates, underuse, price increases, alternatives, and annual renewals.
- AI-generated negotiation, downgrade, and cancellation scripts.
- Newsletter unsubscribe automation.
- Marketplace for opt-in shared subscriptions with trusted contacts or local users.
- Stripe-powered shared subscription collections, distribution, reminders, and payment status tracking.
- Marketplace ratings, reviews, trust profiles, filtering, and sorting.
- Household pools with equal, percentage, or usage-based split rules.
- Community forum, curated subscription lists, and reputation.
- Corporate/team plan with SaaS seat management.
- Direct bill payment and optional automatic payments.
- Corporate/team plan with SaaS and seat management.

## Core Pages

- `/login`: user login.
- `/signup`: user signup.
- `/dashboard`: spend summary, trial warnings, renewal warnings, recent changes, budget snapshot, insights, and quick actions.
- `/subscriptions`: searchable and filterable subscription list.
- `/subscriptions/new`: fast add form for subscriptions and trials.
- `/subscriptions/[id]`: subscription detail, action panel, metadata, history, cancellation flow, and generated support email.
- `/trials`: dedicated free trial management view.
- `/notifications`: in-app notification center.
- `/settings`: profile, timezone, reminders, quiet hours, data export, delete account, and connected services.
- `/import/csv`: CSV upload, validation, preview, and commit flow.
- `/budget`: budget overview, targets, progress, spending trends, forecast, and overspending alerts.
- `/household`: household members, permissions, shared subscriptions, pools, and cost responsibility.
- `/marketplace`: later feature for discovering and managing opt-in subscription shares.

## Onboarding Requirements

The first-run flow should get a user to value quickly without requiring bank or email integrations.

- Welcome wizard.
- Manual add for existing subscriptions.
- Quick add for active free trials.
- Notification preference setup, with email enabled by default.
- Optional CSV import.
- Sample data option for demo mode.
- Personalized checklist for adding first subscription, setting a budget goal, and understanding shared subscriptions.
- Tooltips or short contextual guidance for marketplace concepts once marketplace exists.

## Dashboard Requirements

Header KPIs:

- Total monthly recurring cost, normalized across cadences.
- Total annual recurring cost.
- Number of active subscriptions.
- Number of trials ending in the next 14 days.
- Next renewal date and amount.
- Personal spend versus shared gross spend once sharing exists.

Primary sections:

- Trials ending soon.
- Renewals this month.
- Budget progress.
- Spending trends.
- AI-powered insights.
- Recent changes.
- Quick actions: add subscription, add trial, upload CSV, notification settings.

## Subscription List Requirements

Users must be able to search by provider, subscription name, account email, notes, and category.

Filters:

- Status.
- Category.
- Billing cadence.
- Upcoming renewal window.
- Provider.
- Personal, shared, or household.
- Detection source, once integrations exist.

Sorting:

- Renewal date.
- Price.
- Name.
- Last updated.
- Personal cost.
- Gross cost.

## Subscription Detail Requirements

Summary:

- Provider name.
- Category.
- Status.
- Cost.
- Billing cadence.
- Renewal date.
- Trial end and cancel-by date when applicable.
- Personal share and gross cost when shared.

Metadata:

- Website.
- Login URL.
- Billing portal URL.
- Cancellation URL.
- Support URL.
- Account email for the provider.
- Payment method label, such as "Visa ending 1234".
- Notes.
- Last usage date.
- Detection source and confidence, later.

Actions:

- Cancel or unsubscribe.
- Mark cancellation requested.
- Mark as canceled.
- Renew.
- Change plan.
- Update payment details.
- Open billing portal.
- Open support contact.
- Generate support email draft.
- Add to calendar.
- Review AI advice.
- Record account email update reminders without storing provider passwords.
- Record provider password update reminders without storing provider passwords.

History:

- Status changes.
- Price changes.
- Renewal date changes.
- Cancellation steps.
- Detection/merge events.
- Notification sends.

## Free Trial Requirements

The app needs a dedicated trial-first workflow because trial conversion is one of the highest-risk moments.

- Trial start date.
- Trial end date.
- Cancel-by date, defaulting to trial end date but editable.
- Expected post-trial price.
- Big warning indicators at 14, 7, 2, and 1 day windows.
- Default reminder schedule: 7 days before cancel-by, 2 days before cancel-by, and the morning of cancel-by in the user's timezone.
- Quick action to cancel now.
- AI or email-assisted trial detection later.
- Manual usage and value prompts to help decide whether to continue.

## Notification Requirements

Channels:

- In-app for MVP.
- Email for MVP.
- SMS and push later.

Reminder types:

- Trial ending soon.
- Cancel-by soon.
- Renewal soon.
- Annual renewal upcoming.
- Price increase.
- Budget approaching limit.
- Budget exceeded.
- Shared payment due.
- Shared payment overdue.
- Monthly subscription review.

Rules:

- Use the user's timezone. The initial fallback from the Base44 brief is Australia/Brisbane when no timezone is set.
- Let users configure lead times.
- Support quiet hours later.
- Deduplicate notifications. Do not send the same notification type twice for the same subscription and event window.
- Generate or refresh scheduled notifications when subscriptions or reminder settings change.
- Background runner checks due notifications on an interval, initially every 15 minutes.
- Failed sends should retry with limited exponential backoff.

## Data Model

Core entities to preserve:

### User

- `id`
- `email`
- `authProvider`
- `timezone`
- `createdAt`

### Subscription

- `id`
- `userId`
- `providerName`
- `category`
- `status`
- `billingCadence`
- `intervalDays` for custom cadence
- `priceAmount`
- `currency`
- `startDate`
- `renewalDate`
- `trialStartDate`
- `trialEndDate`
- `cancelByDate`
- `postTrialPriceAmount`
- `accountEmailForProvider`
- `loginUrl`
- `billingUrl`
- `cancelUrl`
- `supportUrl`
- `paymentMethodLabel`
- `notes`
- `lastUsageDate`
- `isShared`
- `sharedGrossAmount`
- `personalShareAmount`
- `dataSource`
- `createdAt`
- `updatedAt`

### SubscriptionEvent / BillingHistory

- `id`
- `subscriptionId`
- `eventType`
- `eventDate`
- `amount`
- `currency`
- `metadata`
- `createdAt`

Event types should include Renewal, TrialEnd, CancelBy, PriceChange, StatusChange, SharedPayment, ImportDetected, EmailDetected, BankDetected, and ProviderSync.

### Notification

- `id`
- `userId`
- `subscriptionId`
- `type`
- `scheduledFor`
- `sentAt`
- `channel`
- `status`
- `dedupeKey`
- `payload`
- `attemptCount`
- `lastError`
- `createdAt`
- `updatedAt`

### AuditLog

- `id`
- `userId`
- `entityType`
- `entityId`
- `action`
- `before`
- `after`
- `createdAt`

### Budget

- `id`
- `userId`
- `period`
- `amount`
- `currency`
- `scope`
- `category`
- `createdAt`
- `updatedAt`

### Household

- `id`
- `ownerUserId`
- `name`
- `createdAt`
- `updatedAt`

### HouseholdMember

- `id`
- `householdId`
- `userId`
- `email`
- `displayName`
- `role`
- `status`
- `permissions`
- `createdAt`
- `updatedAt`

### SubscriptionShare

- `id`
- `subscriptionId`
- `householdId`
- `ownerUserId`
- `participantUserId`
- `participantEmail`
- `splitRule`
- `splitValue`
- `amountOwed`
- `paymentStatus`
- `createdAt`
- `updatedAt`

### DetectedSubscription

- `id`
- `userId`
- `source`
- `sourceExternalId`
- `providerName`
- `description`
- `amount`
- `currency`
- `cadenceGuess`
- `renewalDateGuess`
- `trialEndDateGuess`
- `confidence`
- `evidence`
- `status`
- `linkedSubscriptionId`
- `createdAt`
- `updatedAt`

### PriceChange

- `id`
- `subscriptionId`
- `oldPriceAmount`
- `newPriceAmount`
- `currency`
- `changeDate`
- `reason`
- `source`
- `createdAt`

### MarketplaceListing

Later entity for opt-in shared subscriptions.

- `id`
- `ownerUserId`
- `subscriptionId`
- `title`
- `category`
- `pricePerSeat`
- `availableSlots`
- `visibility`
- `locationScope`
- `status`
- `createdAt`
- `updatedAt`

### Review

Later entity for marketplace trust.

- `id`
- `reviewerUserId`
- `revieweeUserId`
- `listingId`
- `rating`
- `body`
- `createdAt`

## API Surface

Auth:

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- OAuth callback endpoints as needed.

Subscriptions:

- `GET /subscriptions`
- `POST /subscriptions`
- `GET /subscriptions/:id`
- `PUT /subscriptions/:id`
- `DELETE /subscriptions/:id`
- `POST /subscriptions/:id/mark-canceled`
- `POST /subscriptions/:id/cancellation-requested`

Notifications:

- `GET /notifications`
- `PUT /notifications/:id/read`
- `PUT /settings/reminders`

CSV import:

- `POST /import/csv/preview`
- `POST /import/csv/commit`

Budget:

- `GET /budgets`
- `POST /budgets`
- `PUT /budgets/:id`
- `DELETE /budgets/:id`
- `GET /budget/overview`
- `GET /spending/trends`

Household:

- `GET /household`
- `POST /household`
- `POST /household/invitations`
- `PUT /household/members/:id`
- `DELETE /household/members/:id`
- `POST /subscriptions/:id/share`

Detected subscriptions:

- `GET /detected-subscriptions`
- `POST /detected-subscriptions/:id/accept`
- `POST /detected-subscriptions/:id/reject`
- `POST /detected-subscriptions/:id/merge`

Connected services:

- `POST /connections/plaid/link-token`
- `POST /connections/plaid/exchange-token`
- `DELETE /connections/plaid/:id`
- `POST /connections/email/gmail/start`
- `POST /connections/email/outlook/start`
- `DELETE /connections/email/:id`

Marketplace later:

- `GET /marketplace/listings`
- `POST /marketplace/listings`
- `GET /marketplace/listings/:id`
- `POST /marketplace/listings/:id/join`
- `POST /marketplace/reviews`

Calendar and account data:

- `GET /calendar/subscriptions.ics`
- `GET /export`
- `DELETE /account`

## Core Logic

Cost normalization:

- Monthly cadence: monthly = price.
- Yearly cadence: monthly = price / 12.
- Weekly cadence: monthly = price * 52 / 12.
- Custom cadence: monthly = price * 365 / intervalDays / 12.
- Annual equivalent: monthly * 12.
- Shared subscriptions must calculate gross amount and personal responsibility separately.

Renewal calculation:

- Monthly: add one month while preserving the day where possible.
- Yearly: add one year while preserving month/day where possible.
- Weekly: add seven days.
- Custom: add `intervalDays`.
- Missing renewal date should not crash dashboards or notification generation.
- Canceled, expired, and paused subscriptions should not create renewal reminders unless explicitly configured.

Trial logic:

- `cancelByDate` defaults to `trialEndDate`.
- Trial warnings should appear at 14, 7, 2, and 1 day windows.
- Past trial end dates should be flagged for review, not silently hidden.

Notification schedule builder:

- Create scheduled notification rows when a subscription is created or updated.
- Use `dedupeKey = subscriptionId:type:scheduledForISO`.
- Cancel or supersede old future notifications when relevant dates change.
- Use user timezone to compute local reminder time.

Background notification sender:

- Find unsent notifications with `scheduledFor <= now`.
- Send in-app notification and email where enabled.
- Mark `sentAt` on success.
- Mark failed state and retry with limited exponential backoff on failure.

AI insights:

- Underused subscriptions from `lastUsageDate`.
- Duplicate category/provider detection.
- Price increase alerts from `PriceChange`.
- Upcoming annual renewals.
- Negotiation scripts and cheaper alternative suggestions.
- Marketplace recommendations based on current subscriptions, ratings, location, and usage patterns.

## CSV Template

Required columns:

```csv
providerName,category,status,billingCadence,priceAmount,currency,renewalDate,trialEndDate,cancelUrl,billingUrl,accountEmail,notes
```

CSV import must support:

- Validation.
- Preview before commit.
- Per-row errors.
- Duplicate detection by provider, account email, and renewal/price similarity.
- Commit only after user approval.

## Seed Data

Use neutral examples and avoid copyrighted provider logos in MVP graphics unless they are user-provided or loaded from a compliant source.

Sample records:

- Netflix-like streaming subscription.
- Spotify-like music subscription.
- iCloud-like storage subscription.
- Adobe-like annual software subscription.
- Gym or health membership.
- Newsletter subscription.
- SaaS trial ending soon.

## Security And Privacy

Non-negotiables:

- Never store provider account passwords.
- Never store full credit card details.
- Store only safe payment labels, such as "Visa ending 1234".
- Use CSRF protection where relevant.
- Prevent XSS by escaping user content.
- Use ORM or parameterized queries to avoid SQL injection.
- Rate limit auth and sensitive endpoints.
- Encrypt sensitive-ish metadata at rest when feasible, including provider account email and external access tokens.
- Audit subscription changes.
- Support data export.
- Support account deletion.
- Use least-privilege OAuth scopes for Gmail, Outlook, Plaid, and payment providers.
- Keep Plaid access tokens, email refresh tokens, and Stripe secrets on the backend only.

High-risk feature notes:

- Plaid integration should use Link tokens and backend token exchange.
- Gmail/Outlook scanning requires clear permission prompts, least-privilege scopes, and a review queue.
- Stripe shared payments may require Connect, compliance review, identity verification, disputes, refunds, and marketplace fee decisions.
- AI recommendations must be presented as suggestions, not automatic financial action.
- Automated cancellation depends on provider terms and APIs. Default to guided steps unless explicit API support exists.

## Branding And UI

Working name: Subscription Hub.

Tone:

- Helpful.
- Empowering.
- Practical.
- "Take control" without alarmist copy.

Visual direction:

- Clean finance-style UI.
- Mobile-first.
- Accessible contrast and keyboard navigation.
- Prominent warning states for trials, renewals, price increases, and budget limits.
- Calm neutral base with clear status colors.
- Avoid using copyrighted provider logos in MVP unless there is a compliant source and usage path.
- Later, match subscription names to provider logos where legally and technically safe.

## Open Product Decisions

- Whether the first production auth provider should be Clerk, Auth.js, Supabase Auth, or custom email/password.
- Whether the first database should be Neon Postgres, Supabase Postgres, Railway Postgres, or local Postgres for early development.
- Whether email is Postmark, SendGrid, Mailgun, or Resend.
- Whether jobs run through Vercel Cron, a queue worker, or a separate backend process.
- Whether budget categories include only subscriptions first or broader spending categories from day one.
- Whether marketplace sharing is limited to trusted contacts first before any public/local discovery.
- Whether bill payment is in scope before marketplace payment collection.
