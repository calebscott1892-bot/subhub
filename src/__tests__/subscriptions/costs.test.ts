import { describe, expect, test } from "vitest";
import {
  calculateAnnualCost,
  calculateMonthlyCost,
  summarizeSubscriptionSpend,
} from "@/lib/subscriptions/costs";
import type { Subscription } from "@/lib/subscriptions/types";

describe("subscription cost normalization", () => {
  test("normalizes monthly, yearly, weekly, and custom cadences into monthly costs", () => {
    expect(calculateMonthlyCost({ priceAmount: 18, billingCadence: "Monthly" })).toBe(18);
    expect(calculateMonthlyCost({ priceAmount: 120, billingCadence: "Yearly" })).toBe(10);
    expect(calculateMonthlyCost({ priceAmount: 6, billingCadence: "Weekly" })).toBe(26);
    expect(
      calculateMonthlyCost({
        priceAmount: 30,
        billingCadence: "Custom",
        intervalDays: 30,
      }),
    ).toBe(30.42);
  });

  test("normalizes annual cost from the monthly equivalent", () => {
    expect(calculateAnnualCost({ priceAmount: 15, billingCadence: "Monthly" })).toBe(180);
    expect(calculateAnnualCost({ priceAmount: 60, billingCadence: "Yearly" })).toBe(60);
    expect(calculateAnnualCost({ priceAmount: 5, billingCadence: "Weekly" })).toBe(260);
  });

  test("excludes canceled and expired subscriptions from active spend totals", () => {
    const subscriptions: Subscription[] = [
      makeSubscription("active-monthly", "Active", 20, "Monthly"),
      makeSubscription("trial-yearly", "Trial", 120, "Yearly"),
      makeSubscription("paused-weekly", "Paused", 5, "Weekly"),
      makeSubscription("canceled-monthly", "Canceled", 99, "Monthly"),
      makeSubscription("expired-monthly", "Expired", 50, "Monthly"),
    ];

    expect(summarizeSubscriptionSpend(subscriptions)).toEqual({
      activeCount: 3,
      monthlyTotal: 51.67,
      annualTotal: 620,
    });
  });
});

function makeSubscription(
  id: string,
  status: Subscription["status"],
  priceAmount: number,
  billingCadence: Subscription["billingCadence"],
): Subscription {
  return {
    id,
    providerName: id,
    category: "Software",
    status,
    billingCadence,
    priceAmount,
    currency: "USD",
    renewalDate: "2026-06-15",
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z",
  };
}
