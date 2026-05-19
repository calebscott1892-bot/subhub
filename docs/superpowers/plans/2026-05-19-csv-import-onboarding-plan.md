# CSV Import And Onboarding Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans and superpowers:test-driven-development for this pass.

**Goal:** Let users upload a Subscription Hub CSV, see an actionable preview with row-level validation and duplicate warnings, then commit valid rows into persisted subscriptions.

**Architecture:** Keep CSV parsing, validation, duplicate detection, and commit orchestration in tested library modules. Use a Server Action for the import page so the upload works with progressive enhancement. Store no uploaded files.

## Scope

- CSV template file for users.
- CSV parser that supports quoted fields and commas inside quoted values.
- Import row normalization into the existing subscription form input shape.
- Preview state that shows valid rows, invalid rows, and duplicate warnings.
- Commit action that creates only valid rows after explicit approval.
- Navigation from onboarding and subscriptions into import.

## Tasks

### Task 1: Parser And Row Validation

Files:
- `src/lib/import/parse-csv.ts`
- `src/lib/import/validate-import-row.ts`
- `src/__tests__/import/parse-csv.test.ts`
- `src/__tests__/import/validate-import-row.test.ts`

- [ ] Write failing tests for headers, quoted commas, blank rows, invalid dates, missing provider names, and trial cancel-by defaults.
- [ ] Implement parser and row validation.

### Task 2: Duplicate Detection And Commit

Files:
- `src/lib/import/commit-import.ts`
- `src/__tests__/import/commit-import.test.ts`

- [ ] Write failing tests for duplicate warnings against existing subscriptions.
- [ ] Write failing tests that commit only valid rows through a provided create function.
- [ ] Implement duplicate detection and commit orchestration.

### Task 3: Template And Import UI

Files:
- `src/lib/import/csv-template.ts`
- `public/templates/subscription-hub-import-template.csv`
- `src/app/(app)/import/csv/page.tsx`
- `src/app/(app)/import/csv/actions.ts`
- `src/components/app-shell.tsx`
- `src/app/(app)/onboarding/page.tsx`
- `src/app/(app)/subscriptions/page.tsx`

- [ ] Add CSV template content and download link.
- [ ] Add upload textarea/file form with preview and commit behavior.
- [ ] Link import from navigation, onboarding, and subscription list.

### Task 4: Verification

- [ ] Run focused import tests.
- [ ] Run full test suite.
- [ ] Run lint.
- [ ] Run build.
- [ ] Smoke check `/import/csv`.
