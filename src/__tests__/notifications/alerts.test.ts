import { describe, expect, test } from "vitest";
import { calculateBudgetOverview } from "@/lib/budget/calculate-budget";
import {
  buildBudgetAlertSchedules,
  buildMaintenanceReminderSchedule,
  buildMonthlyReviewSchedule,
  isWithinQuietHours,
} from "@/lib/notifications/alerts";
import type { Subscription } from "@/lib/subscriptions/types";

const nowIso = "2026-06-12T09:00:00.000Z";

describe("budget alert schedules", () => {
  test("exceeded budgets produce one month-deduped alert naming over categories", () => {
    const overview = calculateBudgetOverview(
      [
        makeSubscription({ id: "tv", category: "Streaming", priceAmount: 60 }),
      ],
      50,
      [{ category: "Streaming", monthlyTarget: 40 }],
    );

    const schedules = buildBudgetAlertSchedules({
      userId: "user-1",
      overview,
      currency: "USD",
      monthKey: "2026-06",
      nowIso,
    });

    expect(schedules).toHaveLength(1);
    expect(schedules[0]).toMatchObject({
      type: "BudgetExceeded",
      dedupeKey: "budget:over:user-1:2026-06",
    });
    expect(schedules[0].payload.body).toContain("Over in: Streaming");
  });

  test("approaching budgets alert and on-track budgets stay silent", () => {
    const approaching = buildBudgetAlertSchedules({
      userId: "user-1",
      overview: calculateBudgetOverview(
        [makeSubscription({ id: "tv", priceAmount: 90 })],
        100,
        [],
      ),
      currency: "USD",
      monthKey: "2026-06",
      nowIso,
    });
    const onTrack = buildBudgetAlertSchedules({
      userId: "user-1",
      overview: calculateBudgetOverview(
        [makeSubscription({ id: "tv", priceAmount: 40 })],
        100,
        [],
      ),
      currency: "USD",
      monthKey: "2026-06",
      nowIso,
    });

    expect(approaching[0]?.type).toBe("BudgetApproaching");
    expect(onTrack).toHaveLength(0);
  });
});

describe("monthly review schedule", () => {
  test("builds one month-deduped reminder only when enabled", () => {
    const enabled = buildMonthlyReviewSchedule({
      userId: "user-1",
      enabled: true,
      monthKey: "2026-06",
      nowIso,
    });
    const disabled = buildMonthlyReviewSchedule({
      userId: "user-1",
      enabled: false,
      monthKey: "2026-06",
      nowIso,
    });

    expect(enabled[0]).toMatchObject({
      type: "MonthlyReview",
      dedupeKey: "review:user-1:2026-06",
    });
    expect(disabled).toHaveLength(0);
  });
});

describe("maintenance reminder schedule", () => {
  test("builds a date-deduped reminder linked to the subscription", () => {
    const schedule = buildMaintenanceReminderSchedule({
      userId: "user-1",
      subscriptionId: "netflix",
      providerName: "Netflix Premium",
      kind: "password",
      date: "2026-07-01",
      scheduledForIso: "2026-06-30T23:00:00.000Z",
    });

    expect(schedule).toMatchObject({
      type: "AccountMaintenance",
      dedupeKey: "maintenance:netflix:password:2026-07-01",
    });
    expect(schedule.payload.body).toContain("rotate the password");
    expect(schedule.payload.url).toBe("/subscriptions/netflix");
  });
});

describe("quiet hours", () => {
  test("handles same-day and midnight-wrapping windows", () => {
    const morning = new Date("2026-06-12T08:30:00.000Z");
    const night = new Date("2026-06-12T23:30:00.000Z");

    expect(isWithinQuietHours(morning, "UTC", 8, 12)).toBe(true);
    expect(isWithinQuietHours(morning, "UTC", 12, 14)).toBe(false);
    expect(isWithinQuietHours(night, "UTC", 22, 7)).toBe(true);
    expect(isWithinQuietHours(morning, "UTC", 22, 7)).toBe(false);
  });

  test("disabled when hours are unset or identical", () => {
    const now = new Date("2026-06-12T08:30:00.000Z");

    expect(isWithinQuietHours(now, "UTC", null, 7)).toBe(false);
    expect(isWithinQuietHours(now, "UTC", 8, 8)).toBe(false);
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
    renewalDate: "2026-06-28",
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z",
    ...overrides,
  };
}
