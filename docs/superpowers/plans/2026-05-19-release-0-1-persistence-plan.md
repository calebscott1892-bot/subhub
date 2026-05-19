# Release 0.1 Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static sample subscriptions with durable local persistence so Subscription Hub can create, list, view, and edit real subscriptions.

**Architecture:** Use Prisma with SQLite for local development and a schema shaped to move to Postgres later. Keep business rules in tested library modules, keep persistence behind a repository interface, and use Next Server Actions for progressive-enhancement form submissions.

**Tech Stack:** Next.js 16.2.6 App Router, React 19, TypeScript, Prisma, SQLite, Vitest, Tailwind 4.

---

## Scope

This pass implements local durable subscription data. It does not implement production auth, Plaid, email scanning, notifications, or household sharing yet.

## Decisions

- Use a fixed `demo-user` owner until real auth lands.
- Use Prisma SQLite with `DATABASE_URL="file:./dev.db"` for local development.
- Commit `.env.example` and `.env.test`; do not commit `.env`.
- Use Server Actions for create/update/delete because the Next 16 local docs support form actions and warn to verify authorization inside every action.
- Keep sample data as seed data instead of page-only static data.

## Tasks

### Task 1: Validation Layer

**Files:**
- Create: `src/lib/subscriptions/validation.ts`
- Test: `src/__tests__/subscriptions/validation.test.ts`

- [ ] Add a failing test that trims provider names, parses numeric prices, defaults `cancelByDate` from `trialEndDate`, and rejects blank provider names.
- [ ] Run `npm test -- src/__tests__/subscriptions/validation.test.ts` and confirm it fails because `validation.ts` does not exist.
- [ ] Implement `parseSubscriptionFormData(formData: FormData)` with explicit enum validation and field normalization.
- [ ] Run the focused test and confirm it passes.

### Task 2: Prisma Schema And Seed

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `.env.example`
- Create: `.env.test`
- Modify: `package.json`

- [ ] Install `prisma`, `@prisma/client`, and `tsx`.
- [ ] Add Prisma generator/client configuration and a `Subscription` model matching the current TypeScript `Subscription` shape plus `userId`.
- [ ] Add seed script that inserts the current sample subscriptions for `demo-user`.
- [ ] Add scripts: `db:generate`, `db:push`, `db:seed`, `db:reset`.
- [ ] Run `npm run db:generate`, `npm run db:push`, and `npm run db:seed`.

### Task 3: Repository Layer

**Files:**
- Create: `src/lib/db/prisma.ts`
- Create: `src/lib/subscriptions/repository.ts`
- Test: `src/__tests__/subscriptions/repository.test.ts`

- [ ] Add failing tests against an in-memory fake Prisma-like client for list, find, create, update, delete, and owner scoping.
- [ ] Implement repository functions: `listSubscriptions`, `getSubscriptionById`, `createSubscription`, `updateSubscription`, and `deleteSubscription`.
- [ ] Map Prisma records to the existing `Subscription` type.
- [ ] Confirm repository tests pass.

### Task 4: Server Actions

**Files:**
- Create: `src/app/(app)/subscriptions/actions.ts`

- [ ] Add Server Actions: `createSubscriptionAction`, `updateSubscriptionAction`, `deleteSubscriptionAction`.
- [ ] Ensure each action uses `demo-user`, validates form data, mutates through repository functions, calls `revalidatePath`, and redirects after create/update/delete.

### Task 5: Wire Pages To Persistence

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/(app)/subscriptions/page.tsx`
- Modify: `src/app/(app)/subscriptions/new/page.tsx`
- Modify: `src/app/(app)/subscriptions/[id]/page.tsx`
- Create: `src/components/subscription-form.tsx`

- [ ] Replace `sampleSubscriptions` reads with repository reads.
- [ ] Reuse `SubscriptionForm` for new and edit states.
- [ ] Add edit and delete actions to subscription detail.
- [ ] Keep empty states readable if no subscriptions exist.
- [ ] Preserve the current visual direction and responsive layout.

### Task 6: Verification

**Files:**
- Modify only if verification reveals a defect.

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `npm run dev -- --port 3002`.
- [ ] Smoke check `/dashboard`, `/subscriptions`, `/subscriptions/new`, and one persisted detail route.

