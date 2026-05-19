import { describe, expect, test } from "vitest";
import {
  getDashboardMetrics,
  getTrialsEndingSoon,
} from "@/lib/subscriptions/selectors";
import type { Subscription } from "@/lib/subscriptions/types";

describe("subscription dashboard selectors", () => {
  test("computes dashboard metrics from active subscriptions", () => {
    const metrics = getDashboardMetrics(
      [
        makeSubscription("music", "Active", "Monthly", 12, "2026-05-25"),
        makeSubscription("storage", "Active", "Yearly", 120, "2026-06-02"),
        {
          ...makeSubscription("trial", "Trial", "Monthly", 20, "2026-05-22"),
          trialEndDate: "2026-05-28",
          cancelByDate: "2026-05-27",
        },
        makeSubscription("old", "Canceled", "Monthly", 50, "2026-05-20"),
      ],
      "2026-05-19",
    );

    expect(metrics).toEqual({
      activeCount: 3,
      annualTotal: 504,
      monthlyTotal: 42,
      nextRenewal: expect.objectContaining({
        id: "trial",
        providerName: "trial",
      }),
      trialsEndingSoonCount: 1,
    });
  });

  test("finds active trials ending inside a date window by cancel-by date first", () => {
    const trials = getTrialsEndingSoon(
      [
        {
          ...makeSubscription("cancel-first", "Trial", "Monthly", 10, "2026-06-01"),
          trialEndDate: "2026-06-04",
          cancelByDate: "2026-05-24",
        },
        {
          ...makeSubscription("trial-end-only", "Trial", "Monthly", 10, "2026-06-01"),
          trialEndDate: "2026-05-22",
          cancelByDate: null,
        },
        {
          ...makeSubscription("outside-window", "Trial", "Monthly", 10, "2026-06-01"),
          trialEndDate: "2026-06-20",
          cancelByDate: "2026-06-18",
        },
      ],
      "2026-05-19",
      14,
    );

    expect(trials.map((trial) => trial.id)).toEqual([
      "trial-end-only",
      "cancel-first",
    ]);
  });
});

function makeSubscription(
  id: string,
  status: Subscription["status"],
  billingCadence: Subscription["billingCadence"],
  priceAmount: number,
  renewalDate: string | null,
): Subscription {
  return {
    id,
    providerName: id,
    category: "Software",
    status,
    billingCadence,
    priceAmount,
    currency: "USD",
    renewalDate,
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z",
  };
}
