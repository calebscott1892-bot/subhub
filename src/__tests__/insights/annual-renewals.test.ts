import { describe, expect, test } from "vitest";
import { findUpcomingAnnualRenewals } from "@/lib/insights/annual-renewals";
import { getSubscriptionInsights } from "@/lib/insights/get-insights";
import type { Subscription } from "@/lib/subscriptions/types";

const fromDate = "2026-05-19";

describe("annual renewal insight", () => {
  test("flags yearly renewals inside the window sorted by soonest", () => {
    const insights = findUpcomingAnnualRenewals(
      [
        makeSubscription({
          id: "soon",
          billingCadence: "Yearly",
          priceAmount: 240,
          renewalDate: "2026-06-20",
        }),
        makeSubscription({
          id: "sooner",
          billingCadence: "Yearly",
          priceAmount: 99,
          renewalDate: "2026-05-30",
        }),
        makeSubscription({
          id: "far",
          billingCadence: "Yearly",
          priceAmount: 500,
          renewalDate: "2026-09-15",
        }),
        makeSubscription({ id: "monthly", renewalDate: "2026-05-25" }),
      ],
      fromDate,
    );

    expect(
      insights.map((insight) => [insight.subscription.id, insight.daysAway]),
    ).toEqual([
      ["sooner", 11],
      ["soon", 32],
    ]);
    expect(insights[0].amount).toBe(99);
  });

  test("excludes past renewals and non-spend statuses", () => {
    const insights = findUpcomingAnnualRenewals(
      [
        makeSubscription({
          id: "past",
          billingCadence: "Yearly",
          renewalDate: "2026-05-01",
        }),
        makeSubscription({
          id: "expired",
          billingCadence: "Yearly",
          status: "Expired",
          renewalDate: "2026-06-01",
        }),
      ],
      fromDate,
    );

    expect(insights).toHaveLength(0);
  });
});

describe("insights aggregator", () => {
  test("combines all insight kinds with a total count", () => {
    const insights = getSubscriptionInsights(
      [
        makeSubscription({
          id: "stale",
          lastUsageDate: "2026-01-01",
        }),
        makeSubscription({
          id: "annual",
          billingCadence: "Yearly",
          renewalDate: "2026-06-01",
        }),
        makeSubscription({
          id: "stream-a",
          providerName: "Netflix",
          category: "Streaming",
        }),
        makeSubscription({
          id: "stream-b",
          providerName: "Hulu",
          category: "Streaming",
        }),
      ],
      fromDate,
    );

    expect(insights.underused).toHaveLength(1);
    expect(insights.duplicates).toHaveLength(1);
    expect(insights.annualRenewals).toHaveLength(1);
    expect(insights.insightCount).toBe(3);
  });
});

function makeSubscription(
  overrides: Partial<Subscription> & { id: string },
): Subscription {
  return {
    providerName: overrides.id,
    category: "Software",
    status: "Active",
    billingCadence: "Monthly",
    priceAmount: 10,
    currency: "USD",
    renewalDate: "2026-06-15",
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z",
    ...overrides,
  };
}
