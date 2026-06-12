import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { SubscriptionInsights } from "@/lib/insights/get-insights";

const MAX_CARDS = 6;

type InsightCard = {
  key: string;
  kind: string;
  title: string;
  detail: string;
  href: string;
};

export function InsightsPanel({
  insights,
  currency,
}: {
  insights: SubscriptionInsights;
  currency: string;
}) {
  const cards = buildInsightCards(insights, currency);

  return (
    <section className="rounded-lg border border-[#dbe3dc] bg-white">
      <div className="flex items-center justify-between border-b border-[#e5ebe6] px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold">Insights</h2>
          <p className="text-sm text-[#68766f]">
            Deterministic checks: annual renewals, unused spend, and overlap.
          </p>
        </div>
        <p className="text-sm font-semibold text-[#176143]">
          {insights.insightCount} found
        </p>
      </div>
      {cards.length > 0 ? (
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              className="rounded-md border border-[#dbe3dc] bg-[#f8faf7] p-4 transition hover:border-[#9fb8a8] hover:bg-[#f1f6f0]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68766f]">
                {card.kind}
              </p>
              <p className="mt-2 font-semibold text-[#16201d]">{card.title}</p>
              <p className="mt-1 text-sm text-[#68766f]">{card.detail}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-sm text-[#68766f]">
          Nothing needs attention right now. Insights appear here when annual
          renewals approach, subscriptions sit unused, or categories overlap.
        </div>
      )}
    </section>
  );
}

function buildInsightCards(
  insights: SubscriptionInsights,
  currency: string,
): InsightCard[] {
  const cards: InsightCard[] = [];

  for (const renewal of insights.annualRenewals) {
    cards.push({
      key: `annual-${renewal.subscription.id}`,
      kind: "Annual renewal",
      title: renewal.subscription.providerName,
      detail: `${formatCurrency(renewal.amount, currency)} charge in ${
        renewal.daysAway
      } day${renewal.daysAway === 1 ? "" : "s"}.`,
      href: `/subscriptions/${renewal.subscription.id}`,
    });
  }

  for (const increase of insights.priceIncreases) {
    cards.push({
      key: `price-${increase.priceChange.id}`,
      kind: "Price increase",
      title: increase.subscription.providerName,
      detail: `Up ${formatCurrency(increase.increaseAmount, currency)} (${
        increase.increasePercent
      }%) to ${formatCurrency(increase.priceChange.newPriceAmount, currency)} on ${increase.priceChange.changeDate}.`,
      href: `/subscriptions/${increase.subscription.id}`,
    });
  }

  for (const underused of insights.underused) {
    cards.push({
      key: `underused-${underused.subscription.id}`,
      kind: "Possibly unused",
      title: underused.subscription.providerName,
      detail: `Unused for ${underused.daysSinceLastUse} days while costing ${formatCurrency(
        underused.monthlyCost,
        currency,
      )}/mo.`,
      href: `/subscriptions/${underused.subscription.id}`,
    });
  }

  for (const duplicate of insights.duplicates) {
    cards.push({
      key: `duplicate-${duplicate.kind}-${duplicate.label}`,
      kind: duplicate.kind === "provider" ? "Duplicate provider" : "Category overlap",
      title:
        duplicate.kind === "provider"
          ? `${duplicate.label} appears ${duplicate.subscriptions.length} times`
          : `${duplicate.subscriptions.length} ${duplicate.label} services`,
      detail: `${formatCurrency(duplicate.combinedMonthlyCost, currency)}/mo combined. Worth keeping all of them?`,
      href: "/subscriptions",
    });
  }

  return cards.slice(0, MAX_CARDS);
}
