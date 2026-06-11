import Link from "next/link";
import {
  BudgetProgressBar,
  budgetStatusLabel,
  budgetStatusTextClass,
} from "@/components/budget-progress";
import { calculateBudgetOverview } from "@/lib/budget/calculate-budget";
import { buildChargeForecast } from "@/lib/budget/forecast";
import { getBudgetSettings, getCategoryTargets } from "@/lib/budget/repository";
import { categoryTargetFieldName } from "@/lib/budget/validation";
import { formatCurrency } from "@/lib/format";
import {
  DEMO_USER_ID,
  listSubscriptions,
} from "@/lib/subscriptions/repository";
import { SUBSCRIPTION_CATEGORIES } from "@/lib/subscriptions/types";
import { saveBudgetTargetsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const today = getTodayDateOnly();
  const subscriptions = await listSubscriptions(DEMO_USER_ID);
  const settings = await getBudgetSettings(DEMO_USER_ID);
  const categoryTargets = await getCategoryTargets(DEMO_USER_ID);
  const overview = calculateBudgetOverview(
    subscriptions,
    settings.monthlyTarget,
    categoryTargets,
  );
  const forecast = buildChargeForecast(subscriptions, today, 6);
  const currency = settings.currency;
  const categoryByName = new Map(
    overview.categories.map((category) => [category.category, category]),
  );
  const maxForecastTotal = Math.max(
    ...forecast.months.map((month) => month.total),
    1,
  );

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#68766f]">
            Budget
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-normal text-[#16201d] md:text-5xl">
            Keep recurring spend inside a monthly plan.
          </h1>
        </div>
        <Link
          href="/subscriptions"
          className="rounded-md border border-[#cbd8d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#22312d] transition hover:bg-[#edf2ed]"
        >
          Review subscriptions
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Monthly spend"
          value={formatCurrency(overview.monthlySpend, currency)}
          detail="Active, trial, and paused subscriptions"
        />
        <MetricCard
          label="Monthly target"
          value={
            overview.monthlyTarget !== null
              ? formatCurrency(overview.monthlyTarget, currency)
              : "Not set"
          }
          detail="Edit it in the targets form below"
        />
        <MetricCard
          label={
            overview.remaining !== null && overview.remaining < 0
              ? "Over target by"
              : "Left this month"
          }
          value={
            overview.remaining !== null
              ? formatCurrency(Math.abs(overview.remaining), currency)
              : "-"
          }
          detail={budgetStatusLabel(overview.status)}
        />
        <MetricCard
          label="Next month forecast"
          value={formatCurrency(forecast.months[1]?.total ?? 0, currency)}
          detail="Projected real charges, not normalized"
        />
      </section>

      <section className="rounded-lg border border-[#dbe3dc] bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">This month against target</h2>
            <p className="text-sm text-[#68766f]">
              Normalized monthly cost of everything you currently pay for.
            </p>
          </div>
          <p
            className={`text-sm font-semibold ${budgetStatusTextClass(overview.status)}`}
          >
            {overview.status === "no-target"
              ? "Set a monthly target below to start tracking."
              : `${budgetStatusLabel(overview.status)} - ${Math.round(
                  (overview.utilization ?? 0) * 100,
                )}% used`}
          </p>
        </div>
        <div className="mt-4">
          <BudgetProgressBar
            utilization={overview.utilization}
            status={overview.status}
          />
        </div>
      </section>

      <section className="rounded-lg border border-[#dbe3dc] bg-white">
        <div className="border-b border-[#e5ebe6] px-5 py-4">
          <h2 className="text-lg font-semibold">Upcoming charge forecast</h2>
          <p className="text-sm text-[#68766f]">
            Real charges projected from each renewal date and cadence over the
            next six months.
          </p>
        </div>
        <div className="px-5 py-5">
          <div className="flex h-44 items-end gap-3">
            {forecast.months.map((month) => (
              <div
                key={month.month}
                className="flex h-full flex-1 flex-col justify-end gap-2"
                title={`${month.label}: ${month.charges.length} charge${
                  month.charges.length === 1 ? "" : "s"
                }`}
              >
                <p className="text-center text-xs font-semibold text-[#16201d]">
                  {formatCurrency(month.total, currency)}
                </p>
                <div
                  className="w-full rounded-t-md bg-[#16362f]"
                  style={{
                    height: `${
                      month.total > 0
                        ? Math.max((month.total / maxForecastTotal) * 100, 4)
                        : 2
                    }%`,
                    opacity: month.total > 0 ? 1 : 0.25,
                  }}
                />
                <p className="text-center text-xs text-[#68766f]">
                  {month.label}
                </p>
              </div>
            ))}
          </div>
          {forecast.unscheduledCount > 0 ? (
            <p className="mt-4 rounded-md border border-[#e8d69a] bg-[#fff9df] px-3 py-2 text-sm text-[#7a640f]">
              {forecast.unscheduledCount} active subscription
              {forecast.unscheduledCount === 1 ? " has" : "s have"} no usable
              renewal date and {forecast.unscheduledCount === 1 ? "is" : "are"}{" "}
              not included in this forecast.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-[#dbe3dc] bg-white">
        <div className="border-b border-[#e5ebe6] px-5 py-4">
          <h2 className="text-lg font-semibold">Targets</h2>
          <p className="text-sm text-[#68766f]">
            Leave a field empty to remove that target. Category targets help
            spot which part of your spending is drifting.
          </p>
        </div>
        <form action={saveBudgetTargetsAction} className="px-5 py-5">
          <div className="flex flex-wrap items-end gap-4 border-b border-[#edf1ed] pb-5">
            <label className="block">
              <span className="text-sm font-medium text-[#34443f]">
                Overall monthly target ({currency})
              </span>
              <input
                type="number"
                name="monthlyTarget"
                min="0"
                step="0.01"
                defaultValue={settings.monthlyTarget ?? ""}
                placeholder="e.g. 150"
                className="mt-1 block w-44 rounded-md border border-[#cbd8d0] bg-white px-3 py-2 text-sm text-[#16201d] focus:border-[#176143] focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-[#16362f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214d43]"
            >
              Save targets
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {SUBSCRIPTION_CATEGORIES.map((category) => {
              const progress = categoryByName.get(category);
              const spend = progress?.monthlySpend ?? 0;
              const target = progress?.monthlyTarget ?? null;
              const status = progress?.status ?? "no-target";

              return (
                <div
                  key={category}
                  className="grid items-center gap-3 md:grid-cols-[140px_110px_1fr_150px_150px]"
                >
                  <p className="text-sm font-semibold text-[#16201d]">
                    {category}
                  </p>
                  <p className="text-sm text-[#34443f]">
                    {formatCurrency(spend, currency)}
                    <span className="text-[#68766f]"> /mo</span>
                  </p>
                  <BudgetProgressBar
                    utilization={progress?.utilization ?? null}
                    status={status}
                  />
                  <p
                    className={`text-xs font-semibold ${budgetStatusTextClass(status)}`}
                  >
                    {target !== null
                      ? budgetStatusLabel(status)
                      : spend > 0
                        ? "No target set"
                        : "No spend"}
                  </p>
                  <input
                    type="number"
                    name={categoryTargetFieldName(category)}
                    min="0"
                    step="0.01"
                    defaultValue={target ?? ""}
                    placeholder="No target"
                    className="rounded-md border border-[#cbd8d0] bg-white px-3 py-2 text-sm text-[#16201d] focus:border-[#176143] focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        </form>
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
