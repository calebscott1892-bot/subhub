This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project Docs

Subscription Hub product planning lives in:

- [Product spec](docs/product/subscription-hub-product-spec.md)
- [Feature registry](docs/product/subscription-hub-feature-registry.md)
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

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
