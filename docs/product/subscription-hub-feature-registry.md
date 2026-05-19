# Subscription Hub Feature Registry

Last updated: 2026-05-19

This registry captures the Base44 transcript as durable backlog. Items are grouped by product area and phase so they do not get lost.

Phase key:

- P0: MVP manual subscription hub.
- P1: Budgeting, insights, and household foundations.
- P2: Detection from bank/email and stronger automation.
- P3: Marketplace, split payments, and trust systems.
- P4: Advanced AI, provider integrations, community, and direct bill payment.

## Foundation

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| FOUND-001 | P0 | Local app setup | Next.js App Router, TypeScript, Tailwind, linting, README, env example. |
| FOUND-002 | P0 | Database setup | Postgres with Prisma or equivalent ORM, migrations, seeds. |
| FOUND-003 | P0 | Auth | Email/password first, OAuth optional. Protect all app pages and APIs. |
| FOUND-004 | P0 | User profile | Email, timezone, notification preferences, data export, delete account. |
| FOUND-005 | P0 | Audit logging | Capture subscription create, update, delete, status, and price changes. |
| FOUND-006 | P0 | Demo/sample data | Let users load sample subscriptions for onboarding or demo mode. |

## Subscription Tracking

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| SUB-001 | P0 | Subscription CRUD | Manual create, read, update, delete. |
| SUB-002 | P0 | Status model | Active, Trial, Paused, Canceled, Expired. |
| SUB-003 | P0 | Billing cadence | Monthly, Yearly, Weekly, Custom with optional interval days. |
| SUB-004 | P0 | Cost normalization | Monthly and annual equivalents. |
| SUB-005 | P0 | Renewal calculation | Predict next renewal from cadence while handling edge dates. |
| SUB-006 | P0 | Subscription metadata | Provider, category, account email, URLs, payment label, notes. |
| SUB-007 | P0 | Cancellation workflow | Cancellation link, guided steps, generated support email, status tracking. |
| SUB-008 | P0 | Subscription list | Search, filter, sort, responsive table/cards. |
| SUB-009 | P0 | Subscription detail | Summary, actions, metadata, history. |
| SUB-010 | P1 | Last usage date | Enables underuse insights. |
| SUB-011 | P1 | Price history | Old price, new price, change date, reason, source. |
| SUB-012 | P2 | Provider sync source labels | Mark fields as manual, bank-detected, email-detected, or provider-fetched. |
| SUB-013 | P4 | Provider management APIs | Cancel, upgrade, downgrade, fetch plan, renewal, and price where provider APIs allow. |
| SUB-014 | P0 | Plan, payment, support, and renewal links | Deep links for renew, change plan, update payment, billing portal, support, and login. |
| SUB-015 | P1 | Account maintenance reminders | Remind users to update account email or provider password without storing provider passwords. |

## Onboarding

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| ONBOARD-001 | P0 | Welcome wizard | Guide users through first subscription, first trial, reminders, and optional CSV import. |
| ONBOARD-002 | P0 | Sample data option | Let users explore the product with demo subscriptions. |
| ONBOARD-003 | P1 | Personalized checklist | Add first subscription, set a budget, review trials, and understand shared subscriptions. |
| ONBOARD-004 | P3 | Marketplace education | Explain trusted sharing, payments, reviews, and risk controls when marketplace is enabled. |

## Free Trials

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| TRIAL-001 | P0 | Trial dates | Trial start, trial end, cancel-by, post-trial price. |
| TRIAL-002 | P0 | Trial dashboard warnings | 14, 7, 2, and 1 day urgency windows. |
| TRIAL-003 | P0 | Dedicated trials page | Sort by cancel-by and trial end date. |
| TRIAL-004 | P0 | Trial reminders | 7 days, 2 days, and morning of cancel-by. |
| TRIAL-005 | P1 | Trial value prompt | Ask whether the trial is worth continuing. |
| TRIAL-006 | P2 | Trial auto-detection | Detect trials from email and transaction data. |
| TRIAL-007 | P4 | AI trial continuation advice | Use usage and cost-benefit signals. |
| TRIAL-008 | P4 | One-click cancellation where supported | Only where provider API and user authorization make it safe. |

## Notifications

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| NOTIF-001 | P0 | In-app notifications | Notification center and read state. |
| NOTIF-002 | P0 | Email notifications | Trial and renewal reminders. |
| NOTIF-003 | P0 | Reminder preferences | Enable/disable types and lead times. |
| NOTIF-004 | P0 | Timezone-safe scheduling | User timezone with Australia/Brisbane fallback from Base44 brief. |
| NOTIF-005 | P0 | Dedupe keys | Unique notification per subscription, type, and scheduled time. |
| NOTIF-006 | P0 | Background sender | Periodic runner, due notifications, retries, failure state. |
| NOTIF-007 | P1 | Budget alerts | Approaching and exceeded limits. |
| NOTIF-008 | P1 | Price increase alerts | Notify on significant price hikes. |
| NOTIF-009 | P1 | Monthly review reminders | Prompt users to review subscriptions. |
| NOTIF-010 | P3 | Shared payment reminders | Due and overdue split payment alerts. |
| NOTIF-011 | P2 | SMS/push | Optional later channels. |

## Dashboard And Analytics

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| DASH-001 | P0 | KPI cards | Monthly spend, annual spend, active count, trials ending soon, next renewal. |
| DASH-002 | P0 | Renewals section | 7, 14, and 30 day upcoming renewal views. |
| DASH-003 | P0 | Trials ending soon section | Dedicated high-priority warnings. |
| DASH-004 | P0 | Recent changes | Price, status, renewal, import, detection, and cancellation activity. |
| DASH-005 | P1 | Spending trends | Historical monthly spend by category and total. |
| DASH-006 | P1 | Forecast future costs | Project future recurring spend from cadence and history. |
| DASH-007 | P1 | Budget overview widget | Visualize current spend against budget. |
| DASH-008 | P1 | Overspending highlights | Call out categories exceeding goals. |
| DASH-009 | P1 | Actionable advice | Underused, duplicates, annual renewals, price increases, cheaper alternatives. |
| DASH-010 | P4 | Better forecasting | Seasonality and external factor support, such as inflation if reliable. |

## Budgeting

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| BUDGET-001 | P1 | Budget overview page | Monthly/yearly spending targets. |
| BUDGET-002 | P1 | Category budgets | Entertainment, software, utilities, health, news, gaming, finance, groceries, subscriptions, and user-defined categories. |
| BUDGET-003 | P1 | Progress indicators | Charts and clear status colors. |
| BUDGET-004 | P1 | Budget alerts | Approaching and exceeded limits. |
| BUDGET-005 | P1 | Subscription integration | Subscription costs feed budget calculations. |
| BUDGET-006 | P1 | Personal vs shared spend | Separate total subscription cost from user's owed portion. |
| BUDGET-007 | P1 | Analytics by category | Category, institution, provider, and time period. |
| BUDGET-008 | P2 | Transaction-backed budgets | Plaid data improves historical spend and categorization. |

## Import And Detection

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| IMPORT-001 | P0 | CSV template | Required columns from product spec. |
| IMPORT-002 | P0 | CSV preview | Validate before commit. |
| IMPORT-003 | P0 | CSV duplicate detection | Provider, email, price, and renewal similarity. |
| DETECT-001 | P2 | Detection review queue | Users confirm suggestions before adding. |
| DETECT-002 | P2 | Plaid Link | Secure financial institution connection. |
| DETECT-003 | P2 | Plaid transaction import | Fetch recurring charges and merchant data. |
| DETECT-004 | P2 | Plaid token handling | Backend-only token exchange and storage. |
| DETECT-005 | P2 | Gmail OAuth | Scan invoices, trial offers, confirmations, renewals, and price changes. |
| DETECT-006 | P2 | Outlook OAuth | Same detection flow for Outlook. |
| DETECT-007 | P2 | Email parsing | Identify subscription-related messages and extract structured candidates. |
| DETECT-008 | P2 | Confidence scoring | Show evidence and confidence before user approval. |
| DETECT-009 | P2 | Merge with existing subscriptions | Avoid duplicates when a detected candidate matches a manual record. |
| DETECT-010 | P2 | Auto price-change detection | Detect price increases from emails, transactions, or provider sync. |
| DETECT-011 | P4 | Provider API detection | Fetch renewal dates, plan details, and price changes where supported. |
| DETECT-012 | P4 | Newsletter unsubscribe automation | Gmail-assisted unsubscribe flows where permissions and provider rules allow it. |

## Calendar

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| CAL-001 | P1 | ICS export | Export renewal and trial dates to a calendar file. |
| CAL-002 | P2 | Calendar sync | Google/Apple calendar flows if the app needs direct sync beyond ICS. |

## Household And Shared Subscriptions

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| SHARE-001 | P1 | Mark subscription as shared | Track shared versus personal subscriptions. |
| SHARE-002 | P1 | Shared-with fields | Family members, roommates, or trusted contacts. |
| SHARE-003 | P1 | Personal cost allocation | Equal, percentage, or fixed amount split. |
| SHARE-004 | P1 | Household entity | Primary user creates a household. |
| SHARE-005 | P1 | Household invitations | Invite family members by email. |
| SHARE-006 | P1 | Granular permissions | View, add, edit, manage, pay, admin. |
| SHARE-007 | P1 | Visual separation | Personal, shared, and household subscriptions are clearly distinct. |
| SHARE-008 | P2 | Custom sharing plans | One person pays for one service, another pays for another. |
| SHARE-009 | P2 | Usage tracking by member | Track who uses which shared subscription. |
| SHARE-010 | P2 | Shared spending insights | Household spending patterns and fairness. |
| SHARE-011 | P3 | Pools section | Manage pooled shared contributions. |
| SHARE-012 | P3 | Usage-based split rules | Allocate by usage where data exists. |
| SHARE-013 | P4 | AI recommended sharing plans | Optimize based on cost, usage, and household preferences. |

## Marketplace And Payments

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| MKT-001 | P3 | Opt-in marketplace | Users share eligible subscriptions with trusted contacts or local users. |
| MKT-002 | P3 | Listing management | Category, slots, price, owner, terms, status. |
| MKT-003 | P3 | Search and filters | Price, category, rating, number of reviews, location scope. |
| MKT-004 | P3 | Natural language search | Example: "find a cheap music streaming service". |
| MKT-005 | P3 | Recommendations | Suggest listings based on current subscriptions and usage. |
| MKT-006 | P3 | Local discovery | Local-area filters modeled after classified marketplaces. |
| MKT-007 | P3 | Ratings and reviews | Rate owners and sharing experience. |
| MKT-008 | P3 | User trust profiles | Display ratings and review count. |
| PAY-001 | P3 | Stripe integration | Collect and distribute shared subscription costs. |
| PAY-002 | P3 | Automatic member billing | Subscription owner can bill members automatically. |
| PAY-003 | P3 | Payment reminders | Track due, paid, overdue, failed. |
| PAY-004 | P3 | Payment history | Confirmations and settlement record. |
| PAY-005 | P4 | Direct bill payment | Pay renewals directly in app where supported. |
| PAY-006 | P4 | Automatic payments | Optional automatic payments through connected payment methods. |
| PAY-007 | P4 | Connected payment methods | Securely connect payment gateway methods for in-app payments. |
| PAY-008 | P4 | One-click renewal payments | Pay upcoming subscription renewals directly from the app where supported. |

## AI Features

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| AI-001 | P1 | Underused subscription insight | Based on manual last usage date. |
| AI-002 | P1 | Duplicate subscription detection | Same provider or category overlap. |
| AI-003 | P1 | Annual renewal insight | Warn before high-impact yearly charges. |
| AI-004 | P1 | Category-based insights | Streaming overload, unused SaaS, expensive utilities. |
| AI-005 | P2 | Auto-categorization | Analyze names, descriptions, emails, and transactions. |
| AI-006 | P2 | Price increase analysis | Summarize impact and suggest action. |
| AI-007 | P4 | Cheaper alternatives | Suggest lower-cost plans or providers. |
| AI-008 | P4 | Negotiation scripts | Generate tailored email/chat scripts. |
| AI-009 | P4 | Cancellation/downgrade scripts | Generate provider-specific drafts. |
| AI-010 | P4 | Renewal action analysis | Assess importance, market price, savings, and next action. |
| AI-011 | P4 | Marketplace search AI | Natural language search and personalized listing suggestions. |
| AI-012 | P4 | Sharing optimization | Recommend household split plans. |

## Community

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| COM-001 | P4 | Forum/discussion board | Users share subscription tips. |
| COM-002 | P4 | Curated lists | Best subscriptions by category. |
| COM-003 | P4 | Reputation system | Contributions and reviews build reputation. |

## Teams

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| TEAM-001 | P4 | Corporate plan | Small-team SaaS and seat management. |

## Branding And Visual Assets

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| BRAND-001 | P0 | Neutral Subscription Hub brand | Helpful, empowering, calm. |
| BRAND-002 | P0 | No copyrighted provider logos in MVP | Use text, initials, or generic icons unless usage is compliant. |
| BRAND-003 | P2 | Provider logo matching | Match names to logos using compliant data sources where safe. |
| BRAND-004 | P2 | Source labels | Make clear when logos/data came from user, provider, bank, or public source. |

## Security And Compliance

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| SEC-001 | P0 | No provider password storage | Store links and reminders only. |
| SEC-002 | P0 | No full card storage | Payment method label only. |
| SEC-003 | P0 | Auth rate limiting | Protect login/signup. |
| SEC-004 | P0 | OWASP basics | CSRF, XSS, SQL injection protections. |
| SEC-005 | P0 | Audit log | User-visible and internal change trail. |
| SEC-006 | P0 | Data export | User can export data. |
| SEC-007 | P0 | Delete account | Remove user data according to policy. |
| SEC-008 | P2 | Token encryption | Plaid, email, and provider tokens encrypted at rest. |
| SEC-009 | P2 | Least privilege OAuth | Minimal Gmail/Outlook scopes. |
| SEC-010 | P3 | Marketplace trust and abuse | Reviews, reports, disputes, moderation. |
| SEC-011 | P3 | Payment compliance | Stripe Connect, fees, KYC, disputes, refunds, and tax considerations. |

## Testing Requirements

| ID | Phase | Feature | Notes |
| --- | --- | --- | --- |
| TEST-001 | P0 | Date calculation tests | Cadence, leap days, month-end dates, missing renewal. |
| TEST-002 | P0 | Cost normalization tests | Monthly, yearly, weekly, custom, shared. |
| TEST-003 | P0 | Notification dedupe tests | Unique dedupe key and replacement on edits. |
| TEST-004 | P0 | API auth tests | Unauthenticated access blocked. |
| TEST-005 | P0 | CSV validation tests | Valid rows, invalid rows, preview errors. |
| TEST-006 | P1 | Budget calculation tests | Personal versus gross shared costs. |
| TEST-007 | P2 | Detection merge tests | Review queue does not create duplicates. |
| TEST-008 | P3 | Payment status tests | Due, paid, failed, overdue. |

## Explicit Non-Goals For MVP

- Automatic provider cancellation.
- Storing provider passwords.
- Storing full payment card details.
- Public marketplace.
- Direct bill payment.
- Plaid/email scanning as required setup.
- AI taking automatic financial action without user confirmation.
- Corporate/team seat management.
