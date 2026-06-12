import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { formatCurrency, formatDate } from "@/lib/format";
import { calculateMonthlyCost } from "@/lib/subscriptions/costs";
import { requireUserId } from "@/lib/auth/session";
import {
  filterAndSortSubscriptions,
  hasActiveFilters,
  parseListQuery,
} from "@/lib/subscriptions/filtering";
import { listSubscriptions } from "@/lib/subscriptions/repository";
import { SUBSCRIPTION_CATEGORIES } from "@/lib/subscriptions/types";

export const dynamic = "force-dynamic";

const STATUSES = ["Active", "Trial", "Paused", "Canceled", "Expired"];
const CADENCES = ["Monthly", "Yearly", "Weekly", "Custom"];

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const query = parseListQuery(params);
  const allSubscriptions = await listSubscriptions(userId);
  const subscriptions = filterAndSortSubscriptions(allSubscriptions, query);
  const importedCount = params.imported ? Number(params.imported) : null;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#68766f]">
            Subscriptions
          </p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
            Tracked services
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/calendar"
            className="w-fit rounded-md border border-[#cbd8d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#22312d]"
          >
            Export calendar (.ics)
          </a>
          <Link
            href="/import/csv"
            className="w-fit rounded-md border border-[#cbd8d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#22312d]"
          >
            Import CSV
          </Link>
          <Link
            href="/subscriptions/new"
            className="w-fit rounded-md bg-[#16362f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214d43]"
          >
            Add subscription
          </Link>
        </div>
      </section>

      {importedCount !== null && Number.isFinite(importedCount) ? (
        <p className="rounded-md border border-[#cfe1d4] bg-[#f3faf5] px-4 py-3 text-sm font-semibold text-[#176143]">
          Imported {importedCount} subscription
          {importedCount === 1 ? "" : "s"} from CSV.
        </p>
      ) : null}

      <section className="rounded-lg border border-[#dbe3dc] bg-white px-4 py-4 md:px-5">
        <form className="flex flex-wrap items-end gap-3">
          <label className="min-w-44 flex-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
              Search
            </span>
            <input
              type="search"
              name="q"
              defaultValue={query.q}
              placeholder="Provider, email, notes"
              className="mt-1 w-full rounded-md border border-[#cbd8d0] bg-white px-3 py-2 text-sm text-[#16201d] focus:border-[#176143] focus:outline-none"
            />
          </label>
          <FilterSelect label="Status" name="status" value={query.status} options={STATUSES} />
          <FilterSelect
            label="Category"
            name="category"
            value={query.category}
            options={[...SUBSCRIPTION_CATEGORIES]}
          />
          <FilterSelect label="Cadence" name="cadence" value={query.cadence} options={CADENCES} />
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
              Sharing
            </span>
            <select
              name="sharing"
              defaultValue={query.sharing}
              className="mt-1 block rounded-md border border-[#cbd8d0] bg-white px-3 py-2 text-sm text-[#16201d] focus:border-[#176143] focus:outline-none"
            >
              <option value="">All</option>
              <option value="personal">Personal</option>
              <option value="shared">Shared</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
              Sort by
            </span>
            <select
              name="sort"
              defaultValue={query.sort}
              className="mt-1 block rounded-md border border-[#cbd8d0] bg-white px-3 py-2 text-sm text-[#16201d] focus:border-[#176143] focus:outline-none"
            >
              <option value="renewal">Next renewal</option>
              <option value="price">Monthly cost</option>
              <option value="name">Name</option>
              <option value="updated">Last updated</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-md bg-[#16362f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#214d43]"
          >
            Apply
          </button>
          {hasActiveFilters(query) ? (
            <Link
              href="/subscriptions"
              className="rounded-md border border-[#cbd8d0] bg-white px-4 py-2 text-sm font-semibold text-[#22312d] transition hover:bg-[#edf2ed]"
            >
              Reset
            </Link>
          ) : null}
        </form>
        <p className="mt-3 text-sm text-[#68766f]">
          {subscriptions.length} of {allSubscriptions.length} subscription
          {allSubscriptions.length === 1 ? "" : "s"} shown
        </p>
      </section>

      <section className="rounded-lg border border-[#dbe3dc] bg-white">
        <div className="grid gap-3 border-b border-[#e5ebe6] px-4 py-4 md:grid-cols-[1fr_160px_130px_130px_130px] md:px-5">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
            Provider
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f] md:block">
            Status
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f] md:block">
            Monthly
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f] md:block">
            Renewal
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f] md:block">
            Category
          </span>
        </div>

        <div className="divide-y divide-[#edf1ed]">
          {subscriptions.length > 0 ? subscriptions.map((subscription) => (
            <Link
              href={`/subscriptions/${subscription.id}`}
              key={subscription.id}
              className="grid gap-3 px-4 py-4 transition hover:bg-[#f7faf7] md:grid-cols-[1fr_160px_130px_130px_130px] md:items-center md:px-5"
            >
              <div>
                <p className="font-semibold text-[#16201d]">
                  {subscription.providerName}
                </p>
                <p className="mt-1 text-sm text-[#68766f]">
                  {subscription.accountEmailForProvider ?? "No account email"}
                </p>
              </div>
              <StatusPill status={subscription.status} />
              <p className="text-sm font-semibold">
                {formatCurrency(
                  calculateMonthlyCost(subscription),
                  subscription.currency,
                )}
              </p>
              <p className="text-sm text-[#34443f]">
                {formatDate(subscription.renewalDate)}
              </p>
              <p className="text-sm text-[#34443f]">{subscription.category}</p>
            </Link>
          )) : (
            <div className="px-5 py-10 text-sm text-[#68766f]">
              {allSubscriptions.length === 0
                ? "No subscriptions yet. Add the first one to start tracking renewals."
                : "Nothing matches these filters. Reset them to see everything."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
}) {
  return (
    <label>
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value}
        className="mt-1 block rounded-md border border-[#cbd8d0] bg-white px-3 py-2 text-sm text-[#16201d] focus:border-[#176143] focus:outline-none"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
