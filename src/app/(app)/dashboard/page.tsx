import Link from "next/link";
import {
  BudgetProgressBar,
  budgetStatusLabel,
  budgetStatusTextClass,
} from "@/components/budget-progress";
import { InsightsPanel } from "@/components/insights-panel";
import { StatusPill } from "@/components/status-pill";
import { listRecentAuditEvents } from "@/lib/audit/repository";
import { progressAgainstTarget } from "@/lib/budget/calculate-budget";
import { getUpcomingCharges } from "@/lib/budget/forecast";
import { getBudgetSettings } from "@/lib/budget/repository";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { listPriceChanges } from "@/lib/subscriptions/price-history";
import { getSharesForSubscriptions } from "@/lib/household/repository";
import { getSubscriptionInsights } from "@/lib/insights/get-insights";
import { summarizeSharedSpend } from "@/lib/sharing/personal-cost";
import { roundCurrency } from "@/lib/subscriptions/costs";
import { daysUntil } from "@/lib/subscriptions/dates";
import { requireUserId } from "@/lib/auth/session";
import { listSubscriptions } from "@/lib/subscriptions/repository";
import {
  getDashboardMetrics,
  getTrialDeadline,
  getTrialsEndingSoon,
} from "@/lib/subscriptions/selectors";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const today = getTodayDateOnly();
  const subscriptions = await listSubscriptions(userId);
  const budgetSettings = await getBudgetSettings(userId);
  const shares = await getSharesForSubscriptions(
    subscriptions.map((subscription) => subscription.id),
  );
  const metrics = getDashboardMetrics(subscriptions, today);
  const spend = summarizeSharedSpend(subscriptions, shares);
  const upcomingCharges = getUpcomingCharges(subscriptions, today, 45).slice(0, 5);
  const trials = getTrialsEndingSoon(subscriptions, today, 14);
  const priceChanges = await listPriceChanges(userId);
  const recentEvents = await listRecentAuditEvents(userId, 6);
  const insights = getSubscriptionInsights(subscriptions, today, priceChanges);
  const budgetProgress = progressAgainstTarget(
    spend.personalMonthly,
    budgetSettings.monthlyTarget,
  );
  const currency = budgetSettings.currency;

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
          value={formatCurrency(spend.personalMonthly, currency)}
          detail={
            spend.sharedCount > 0
              ? `Your share - ${formatCurrency(spend.grossMonthly, currency)} gross`
              : "Normalized from all active cadences"
          }
        />
        <MetricCard
          label="Annual run rate"
          value={formatCurrency(
            spend.sharedCount > 0
              ? roundCurrency(spend.personalMonthly * 12)
              : metrics.annualTotal,
            currency,
          )}
          detail={
            spend.sharedCount > 0
              ? `Your share - ${formatCurrency(metrics.annualTotal, currency)} gross`
              : "Projected recurring cost"
          }
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

      <section className="rounded-lg border border-[#dbe3dc] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Monthly budget</h2>
            {budgetSettings.monthlyTarget !== null ? (
              <p className="text-sm text-[#68766f]">
                {formatCurrency(spend.personalMonthly, currency)} of{" "}
                {formatCurrency(budgetSettings.monthlyTarget, currency)} used
                {spend.sharedCount > 0 ? " (your share)" : ""}
              </p>
            ) : (
              <p className="text-sm text-[#68766f]">
                No target yet. Set one to get drift warnings before renewals
                hit.
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {budgetSettings.monthlyTarget !== null ? (
              <p
                className={`text-sm font-semibold ${budgetStatusTextClass(budgetProgress.status)}`}
              >
                {budgetStatusLabel(budgetProgress.status)}
              </p>
            ) : null}
            <Link
              href="/budget"
              className="text-sm font-semibold text-[#176143] hover:text-[#0d3d2a]"
            >
              Manage budget
            </Link>
          </div>
        </div>
        {budgetSettings.monthlyTarget !== null ? (
          <div className="mt-4">
            <BudgetProgressBar
              utilization={budgetProgress.utilization}
              status={budgetProgress.status}
            />
          </div>
        ) : null}
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
            {upcomingCharges.length > 0 ? upcomingCharges.map(({ subscription, date, amount }) => (
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
                    {formatCurrency(amount, subscription.currency)}
                  </p>
                  <p className="text-sm text-[#68766f]">{formatDate(date)}</p>
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

      <InsightsPanel insights={insights} currency={currency} />

      <section className="rounded-lg border border-[#dbe3dc] bg-white">
        <div className="border-b border-[#e5ebe6] px-5 py-4">
          <h2 className="text-lg font-semibold">Recent changes</h2>
          <p className="text-sm text-[#68766f]">
            The audit trail of everything that happened in your workspace.
          </p>
        </div>
        <div className="divide-y divide-[#edf1ed]">
          {recentEvents.length > 0 ? (
            recentEvents.map((event) => {
              const row = (
                <>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-[#cbd8d0] bg-[#f3f7f2] px-2.5 py-1 text-xs font-semibold text-[#34443f]">
                      {event.action}
                    </span>
                    <p className="text-sm text-[#16201d]">{event.summary}</p>
                  </div>
                  <p className="text-xs text-[#68766f]">
                    {formatDateTime(event.createdAt)}
                  </p>
                </>
              );

              return event.entityType === "subscription" ? (
                <Link
                  key={event.id}
                  href={`/subscriptions/${event.entityId}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition hover:bg-[#f7faf7]"
                >
                  {row}
                </Link>
              ) : (
                <div
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                >
                  {row}
                </div>
              );
            })
          ) : (
            <div className="px-5 py-6 text-sm text-[#68766f]">
              No changes recorded yet. Edits, imports, and cancellations will
              show up here.
            </div>
          )}
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
