import { describe, expect, test } from "vitest";
import { findUnderusedSubscriptions } from "@/lib/insights/underused";
import type { Subscription } from "@/lib/subscriptions/types";

const fromDate = "2026-05-19";

describe("underused subscription insight", () => {
  test("flags stale subscriptions sorted by most stale first", () => {
    const insights = findUnderusedSubscriptions(
      [
        makeSubscription({ id: "fresh", lastUsageDate: "2026-05-16" }),
        makeSubscription({ id: "stale", lastUsageDate: "2026-03-01" }),
        makeSubscription({ id: "very-stale", lastUsageDate: "2026-01-01" }),
      ],
      fromDate,
    );

    expect(insights.map((insight) => insight.subscription.id)).toEqual([
      "very-stale",
      "stale",
    ]);
    expect(insights[0].daysSinceLastUse).toBe(138);
    expect(insights[1].monthlyCost).toBe(10);
  });

  test("ignores unusable records and respects the threshold parameter", () => {
    const insights = findUnderusedSubscriptions(
      [
        makeSubscription({ id: "no-usage-date", lastUsageDate: null }),
        makeSubscription({
          id: "canceled",
          status: "Canceled",
          lastUsageDate: "2026-01-01",
        }),
        makeSubscription({ id: "ten-days", lastUsageDate: "2026-05-09" }),
      ],
      fromDate,
      10,
    );

    expect(insights.map((insight) => insight.subscription.id)).toEqual([
      "ten-days",
    ]);
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
