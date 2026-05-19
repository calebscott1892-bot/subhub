# Trial Notification Protection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add trial and renewal reminder scheduling so Subscription Hub actively protects users before charges happen.

**Architecture:** Keep scheduling rules in pure tested functions, persist deduped notification rows with Prisma, and refresh future reminders after subscription create/update. Add read-only `/trials` and `/notifications` pages from persisted subscriptions and notification rows.

**Tech Stack:** Next.js 16.2.6 App Router, React 19, TypeScript, Prisma 6.19, SQLite, Vitest, Tailwind 4.

---

## Scope

This pass creates scheduled in-app notification records. It does not send email yet and does not implement a background worker.

## Tasks

### Task 1: Scheduling Rules

**Files:**
- Create: `src/lib/notifications/schedule.ts`
- Test: `src/__tests__/notifications/schedule.test.ts`

- [ ] Write failing tests for trial cancel-by reminders, renewal reminders, dedupe keys, skipped canceled subscriptions, and local 9:00 AM scheduling.
- [ ] Implement `buildNotificationSchedules`.
- [ ] Confirm tests pass.

### Task 2: Notification Persistence

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/lib/notifications/repository.ts`
- Test: `src/__tests__/notifications/repository.test.ts`

- [ ] Add `Notification` model with unique `dedupeKey`.
- [ ] Add repository tests for create/update dedupe, listing, and canceling future notifications for a subscription.
- [ ] Implement repository functions.
- [ ] Run `npm run db:push`.

### Task 3: Action Wiring

**Files:**
- Modify: `src/app/(app)/subscriptions/actions.ts`

- [ ] After create/update, cancel future notification rows for that subscription and insert refreshed schedules.
- [ ] Revalidate dashboard, subscriptions, trials, notifications, and detail routes.

### Task 4: Product Pages

**Files:**
- Create: `src/app/(app)/trials/page.tsx`
- Create: `src/app/(app)/notifications/page.tsx`
- Modify: `src/components/app-shell.tsx`
- Modify: `prisma/seed.ts`

- [ ] Add navigation for Trials and Notifications.
- [ ] Add `/trials` page showing active trials by cancel-by deadline.
- [ ] Add `/notifications` page showing scheduled reminder rows.
- [ ] Seed notification rows from sample subscriptions.

### Task 5: Verification

**Files:**
- Modify only if verification exposes defects.

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `npm run db:seed`.
- [ ] Smoke check `/trials` and `/notifications`.

