import { describe, expect, test } from "vitest";
import {
  calculateNextRenewalDate,
  daysUntil,
  getUpcomingRenewals,
} from "@/lib/subscriptions/dates";
import type { Subscription } from "@/lib/subscriptions/types";

describe("subscription renewal dates", () => {
  test("adds months while clamping invalid month-end days", () => {
    expect(calculateNextRenewalDate("2026-01-31", "Monthly")).toBe("2026-02-28");
    expect(calculateNextRenewalDate("2026-03-31", "Monthly")).toBe("2026-04-30");
  });

  test("adds a year while clamping leap day to February 28 when needed", () => {
    expect(calculateNextRenewalDate("2024-02-29", "Yearly")).toBe("2025-02-28");
  });

  test("adds weekly and custom intervals", () => {
    expect(calculateNextRenewalDate("2026-05-19", "Weekly")).toBe("2026-05-26");
    expect(calculateNextRenewalDate("2026-05-19", "Custom", 45)).toBe("2026-07-03");
  });

  test("returns null when renewal calculation lacks the required date or custom interval", () => {
    expect(calculateNextRenewalDate(null, "Monthly")).toBeNull();
    expect(calculateNextRenewalDate("2026-05-19", "Custom")).toBeNull();
  });

  test("calculates whole local-date day differences without time drift", () => {
    expect(daysUntil("2026-05-26", "2026-05-19")).toBe(7);
    expect(daysUntil("2026-05-18", "2026-05-19")).toBe(-1);
  });

  test("returns active renewals within the requested window in date order", () => {
    const subscriptions: Subscription[] = [
      makeSubscription("late", "Active", "2026-06-10"),
      makeSubscription("soon", "Active", "2026-05-23"),
      makeSubscription("trial", "Trial", "2026-05-21"),
      makeSubscription("missing", "Active", null),
      makeSubscription("canceled", "Canceled", "2026-05-20"),
    ];

    expect(getUpcomingRenewals(subscriptions, "2026-05-19", 14).map((item) => item.id)).toEqual([
      "trial",
      "soon",
    ]);
  });
});

function makeSubscription(
  id: string,
  status: Subscription["status"],
  renewalDate: string | null,
): Subscription {
  return {
    id,
    providerName: id,
    category: "Software",
    status,
    billingCadence: "Monthly",
    priceAmount: 10,
    currency: "USD",
    renewalDate,
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z",
  };
}
