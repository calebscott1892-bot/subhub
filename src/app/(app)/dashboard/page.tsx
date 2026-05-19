import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { formatCurrency, formatDate } from "@/lib/format";
import { daysUntil, getUpcomingRenewals } from "@/lib/subscriptions/dates";
import { DEMO_USER_ID, listSubscriptions } from "@/lib/subscriptions/repository";
import {
  getDashboardMetrics,
  getTrialDeadline,
  getTrialsEndingSoon,
} from "@/lib/subscriptions/selectors";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = getTodayDateOnly();
  const subscriptions = await listSubscriptions(DEMO_USER_ID);
  const metrics = getDashboardMetrics(subscriptions, today);
  const renewals = getUpcomingRenewals(subscriptions, today, 45).slice(0, 5);
  const trials = getTrialsEndingSoon(subscriptions, today, 14);
  const currency = "USD";

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#68766f]">
            Dashboard
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-normal text-[#16201d] md:text-5xl">
            Your recurring spend, renewals, and trials in one view.
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/subscriptions/new"
            className="rounded-md bg-[#16362f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214d43]"
          >
            Add subscription
          </Link>
          <Link
            href="/onboarding"
            className="rounded-md border border-[#cbd8d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#22312d] transition hover:bg-[#edf2ed]"
          >
            Import CSV
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Monthly spend"
          value={formatCurrency(metrics.monthlyTotal, currency)}
          detail="Normalized from all active cadences"
        />
        <MetricCard
          label="Annual run rate"
          value={formatCurrency(metrics.annualTotal, currency)}
          detail="Projected recurring cost"
        />
        <MetricCard
          label="Active tracked"
          value={String(metrics.activeCount)}
          detail="Active, trial, and paused subscriptions"
        />
        <MetricCard
          label="Trials at risk"
          value={String(metrics.trialsEndingSoonCount)}
          detail="Ending or cancel-by inside 14 days"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-[#dbe3dc] bg-white">
          <div className="flex items-center justify-between border-b border-[#e5ebe6] px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">Renewals</h2>
              <p className="text-sm text-[#68766f]">Next expected charges.</p>
            </div>
            <Link
              href="/subscriptions"
              className="text-sm font-semibold text-[#176143] hover:text-[#0d3d2a]"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#edf1ed]">
            {renewals.length > 0 ? renewals.map((subscription) => (
              <Link
                href={`/subscriptions/${subscription.id}`}
                key={subscription.id}
                className="grid gap-3 px-5 py-4 transition hover:bg-[#f7faf7] md:grid-cols-[1fr_auto_auto] md:items-center"
              >
                <div>
                  <p className="font-semibold text-[#16201d]">
                    {subscription.providerName}
                  </p>
                  <p className="mt-1 text-sm text-[#68766f]">
                    {subscription.category} - {subscription.billingCadence}
                  </p>
                </div>
                <StatusPill status={subscription.status} />
                <div className="text-left md:text-right">
                  <p className="font-semibold">
                    {formatCurrency(subscription.priceAmount, subscription.currency)}
                  </p>
                  <p className="text-sm text-[#68766f]">
                    {formatDate(subscription.renewalDate)}
                  </p>
                </div>
              </Link>
            )) : (
              <div className="px-5 py-8 text-sm text-[#68766f]">
                No upcoming renewals. Add subscriptions to start tracking.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[#e8d69a] bg-[#fff9df]">
          <div className="border-b border-[#f1df9d] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#3e2f00]">
              Trials ending soon
            </h2>
            <p className="text-sm text-[#7a640f]">
              Cancel-by dates take priority over trial end dates.
            </p>
          </div>
          <div className="divide-y divide-[#f1df9d]">
            {trials.length > 0 ? trials.map((subscription) => {
              const deadline = getTrialDeadline(subscription);
              return (
                <Link
                  href={`/subscriptions/${subscription.id}`}
                  key={subscription.id}
                  className="block px-5 py-4 transition hover:bg-[#fff4c7]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[#3e2f00]">
                        {subscription.providerName}
                      </p>
                      <p className="mt-1 text-sm text-[#7a640f]">
                        {deadline ? daysUntil(deadline, today) : "-"} days left
                      </p>
                    </div>
                    <p className="text-right text-sm font-semibold text-[#3e2f00]">
                      {formatDate(deadline)}
                    </p>
                  </div>
                </Link>
              );
            }) : (
              <div className="px-5 py-8 text-sm text-[#7a640f]">
                No risky trials in the next 14 days.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#dbe3dc] bg-white p-5">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="text-lg font-semibold">Early insights</h2>
            <p className="mt-2 text-sm leading-6 text-[#68766f]">
              The first pass keeps insights deterministic: annual renewals,
              upcoming trials, and old usage dates are visible before AI enters
              the product.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Insight label="Annual renewal" value="Sep 15" />
            <Insight label="Oldest usage" value="Mar 3" />
            <Insight label="Next charge" value={formatDate(metrics.nextRenewal?.renewalDate)} />
          </div>
        </div>
      </section>
    </div>
  );
}

function getTodayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-[#dbe3dc] bg-white p-5">
      <p className="text-sm font-medium text-[#68766f]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-normal text-[#16201d]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[#68766f]">{detail}</p>
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#dbe3dc] bg-[#f8faf7] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-[#16201d]">{value}</p>
    </div>
  );
}
