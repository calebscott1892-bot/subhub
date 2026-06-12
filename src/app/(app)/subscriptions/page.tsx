import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { formatCurrency, formatDate } from "@/lib/format";
import { calculateMonthlyCost } from "@/lib/subscriptions/costs";
import { requireUserId } from "@/lib/auth/session";
import { listSubscriptions } from "@/lib/subscriptions/repository";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ imported?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const subscriptions = await listSubscriptions(userId);
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
              No subscriptions yet. Add the first one to start tracking renewals.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
