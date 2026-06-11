import { describe, expect, test } from "vitest";
import {
  memberMonthlyTotals,
  personalMonthlyCost,
  summarizeSharedSpend,
} from "@/lib/sharing/personal-cost";
import type { Subscription } from "@/lib/subscriptions/types";

describe("personal cost", () => {
  test("personal cost is the owner share of a shared subscription", () => {
    const netflix = makeSubscription({
      id: "netflix",
      priceAmount: 22.99,
      isShared: true,
      splitType: "Equal",
    });

    expect(
      personalMonthlyCost(netflix, [{ memberId: "a" }, { memberId: "b" }]),
    ).toBe(7.67);
  });

  test("personal cost equals gross for unshared subscriptions or missing shares", () => {
    const personal = makeSubscription({ id: "solo", priceAmount: 15 });
    expect(personalMonthlyCost(personal, [])).toBe(15);

    const sharedWithoutShares = makeSubscription({
      id: "shared-empty",
      priceAmount: 15,
      isShared: true,
      splitType: "Equal",
    });
    expect(personalMonthlyCost(sharedWithoutShares, [])).toBe(15);
  });

  test("summarizes gross versus personal spend across the portfolio", () => {
    const subscriptions = [
      makeSubscription({
        id: "netflix",
        priceAmount: 30,
        isShared: true,
        splitType: "Equal",
      }),
      makeSubscription({ id: "solo", priceAmount: 10 }),
      makeSubscription({ id: "canceled", priceAmount: 99, status: "Canceled" }),
    ];
    const shares = new Map([
      ["netflix", [{ memberId: "a" }, { memberId: "b" }]],
    ]);

    expect(summarizeSharedSpend(subscriptions, shares)).toEqual({
      grossMonthly: 40,
      personalMonthly: 20,
      sharedCount: 1,
    });
  });

  test("totals what each member owes per month across shared subscriptions", () => {
    const subscriptions = [
      makeSubscription({
        id: "netflix",
        priceAmount: 30,
        isShared: true,
        splitType: "Equal",
      }),
      makeSubscription({
        id: "spotify",
        priceAmount: 20,
        isShared: true,
        splitType: "Percentage",
      }),
    ];
    const shares = new Map([
      ["netflix", [{ memberId: "a" }, { memberId: "b" }]],
      ["spotify", [{ memberId: "a", percentage: 40 }]],
    ]);

    const totals = memberMonthlyTotals(subscriptions, shares);

    expect(totals.get("a")).toBe(18);
    expect(totals.get("b")).toBe(10);
  });
});

function makeSubscription(
  overrides: Partial<Subscription> & { id: string },
): Subscription {
  return {
    providerName: overrides.id,
    category: "Streaming",
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
