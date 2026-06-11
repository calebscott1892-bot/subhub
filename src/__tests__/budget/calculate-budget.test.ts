import { describe, expect, test } from "vitest";
import {
  calculateBudgetOverview,
  progressAgainstTarget,
} from "@/lib/budget/calculate-budget";
import type { Subscription } from "@/lib/subscriptions/types";

describe("budget overview calculation", () => {
  test("rolls up normalized monthly spend per category and overall", () => {
    const overview = calculateBudgetOverview(
      [
        makeSubscription({ id: "tv", category: "Streaming", priceAmount: 20 }),
        makeSubscription({
          id: "tools",
          category: "Software",
          priceAmount: 120,
          billingCadence: "Yearly",
        }),
        makeSubscription({
          id: "gym",
          category: "Health",
          priceAmount: 6,
          billingCadence: "Weekly",
        }),
        makeSubscription({
          id: "gone",
          category: "Streaming",
          priceAmount: 99,
          status: "Canceled",
        }),
      ],
      null,
      [],
    );

    expect(overview.monthlySpend).toBe(56);
    expect(overview.status).toBe("no-target");
    expect(
      overview.categories.map(({ category, monthlySpend }) => ({
        category,
        monthlySpend,
      })),
    ).toEqual([
      { category: "Health", monthlySpend: 26 },
      { category: "Streaming", monthlySpend: 20 },
      { category: "Software", monthlySpend: 10 },
    ]);
  });

  test("reports per-category status against targets", () => {
    const overview = calculateBudgetOverview(
      [
        makeSubscription({ id: "tv", category: "Streaming", priceAmount: 30 }),
        makeSubscription({ id: "music", category: "Music", priceAmount: 17 }),
        makeSubscription({ id: "news", category: "News", priceAmount: 5 }),
      ],
      100,
      [
        { category: "Streaming", monthlyTarget: 25 },
        { category: "Music", monthlyTarget: 20 },
        { category: "News", monthlyTarget: 50 },
        { category: "Gaming", monthlyTarget: 10 },
      ],
    );

    const byCategory = Object.fromEntries(
      overview.categories.map((category) => [category.category, category]),
    );

    expect(byCategory.Streaming.status).toBe("over");
    expect(byCategory.Streaming.remaining).toBe(-5);
    expect(byCategory.Music.status).toBe("approaching");
    expect(byCategory.News.status).toBe("on-track");
    expect(byCategory.Gaming).toMatchObject({
      monthlySpend: 0,
      monthlyTarget: 10,
      status: "on-track",
    });
    expect(overview.status).toBe("on-track");
    expect(overview.remaining).toBe(48);
  });

  test("grades overall progress with the approaching threshold", () => {
    expect(progressAgainstTarget(50, null).status).toBe("no-target");
    expect(progressAgainstTarget(50, 0).status).toBe("no-target");
    expect(progressAgainstTarget(84, 100).status).toBe("on-track");
    expect(progressAgainstTarget(85, 100).status).toBe("approaching");
    expect(progressAgainstTarget(100, 100).status).toBe("approaching");
    expect(progressAgainstTarget(100.01, 100).status).toBe("over");
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
