import { describe, expect, test } from "vitest";
import {
  buildChargeForecast,
  getNextCharge,
  getUpcomingCharges,
} from "@/lib/budget/forecast";
import { chargeAmountFor } from "@/lib/subscriptions/costs";
import type { Subscription } from "@/lib/subscriptions/types";

const fromDate = "2026-05-19";

describe("charge forecast", () => {
  test("projects monthly charges into each month of the window", () => {
    const forecast = buildChargeForecast(
      [makeSubscription({ id: "tv", priceAmount: 20, renewalDate: "2026-05-28" })],
      fromDate,
      3,
    );

    expect(forecast.months.map((month) => month.month)).toEqual([
      "2026-05",
      "2026-06",
      "2026-07",
    ]);
    expect(
      forecast.months.map((month) => month.charges.map((charge) => charge.date)),
    ).toEqual([["2026-05-28"], ["2026-06-28"], ["2026-07-28"]]);
    expect(forecast.months.map((month) => month.total)).toEqual([20, 20, 20]);
    expect(forecast.scheduledCount).toBe(1);
    expect(forecast.unscheduledCount).toBe(0);
  });

  test("advances stale renewal dates instead of charging the past", () => {
    const forecast = buildChargeForecast(
      [makeSubscription({ id: "tv", priceAmount: 15, renewalDate: "2026-05-10" })],
      fromDate,
      2,
    );

    expect(
      forecast.months.flatMap((month) => month.charges.map((charge) => charge.date)),
    ).toEqual(["2026-06-10"]);
    expect(forecast.scheduledCount).toBe(1);
  });

  test("aggregates weekly charges and keeps months in order", () => {
    const forecast = buildChargeForecast(
      [
        makeSubscription({
          id: "gym",
          priceAmount: 10,
          billingCadence: "Weekly",
          renewalDate: "2026-05-20",
        }),
      ],
      fromDate,
      2,
    );

    expect(forecast.months[0].total).toBe(20);
    expect(forecast.months[1].total).toBe(40);
  });

  test("uses the post-trial price for trials once they convert", () => {
    const trial = makeSubscription({
      id: "trial",
      status: "Trial",
      priceAmount: 0,
      postTrialPriceAmount: 12,
      renewalDate: "2026-05-27",
    });

    expect(chargeAmountFor(trial)).toBe(12);

    const forecast = buildChargeForecast([trial], fromDate, 1);
    expect(forecast.months[0].total).toBe(12);
  });

  test("counts yearly subscriptions beyond the window as scheduled with no charges", () => {
    const forecast = buildChargeForecast(
      [
        makeSubscription({
          id: "suite",
          billingCadence: "Yearly",
          priceAmount: 600,
          renewalDate: "2026-12-15",
        }),
      ],
      fromDate,
      3,
    );

    expect(forecast.months.every((month) => month.charges.length === 0)).toBe(true);
    expect(forecast.scheduledCount).toBe(1);
    expect(forecast.unscheduledCount).toBe(0);
  });

  test("marks unforecastable subscriptions instead of dropping them silently", () => {
    const forecast = buildChargeForecast(
      [
        makeSubscription({ id: "no-date", renewalDate: null }),
        makeSubscription({
          id: "stale-custom",
          billingCadence: "Custom",
          intervalDays: null,
          renewalDate: "2026-01-01",
        }),
        makeSubscription({ id: "canceled", status: "Canceled" }),
      ],
      fromDate,
      2,
    );

    expect(forecast.scheduledCount).toBe(0);
    expect(forecast.unscheduledCount).toBe(2);
  });

  test("still counts a single future charge for custom cadence without an interval", () => {
    const forecast = buildChargeForecast(
      [
        makeSubscription({
          id: "one-off-custom",
          billingCadence: "Custom",
          intervalDays: null,
          priceAmount: 45,
          renewalDate: "2026-06-02",
        }),
      ],
      fromDate,
      2,
    );

    expect(
      forecast.months.flatMap((month) => month.charges.map((charge) => charge.date)),
    ).toEqual(["2026-06-02"]);
    expect(forecast.scheduledCount).toBe(1);
  });
});

describe("next charge lookup", () => {
  test("rolls a stale renewal date forward to the next real charge", () => {
    const charge = getNextCharge(
      makeSubscription({ id: "tv", priceAmount: 20, renewalDate: "2026-03-28" }),
      fromDate,
    );

    expect(charge).toMatchObject({ date: "2026-05-28", amount: 20 });
  });

  test("returns null for non-spend statuses and missing schedules", () => {
    expect(
      getNextCharge(
        makeSubscription({ id: "canceled", status: "Canceled" }),
        fromDate,
      ),
    ).toBeNull();
    expect(
      getNextCharge(makeSubscription({ id: "no-date", renewalDate: null }), fromDate),
    ).toBeNull();
  });

  test("lists upcoming charges inside the window sorted by date", () => {
    const charges = getUpcomingCharges(
      [
        makeSubscription({ id: "later", renewalDate: "2026-06-01" }),
        makeSubscription({ id: "sooner", renewalDate: "2026-05-21" }),
        makeSubscription({
          id: "beyond-window",
          billingCadence: "Yearly",
          renewalDate: "2026-12-01",
        }),
        makeSubscription({
          id: "trial",
          status: "Trial",
          priceAmount: 0,
          postTrialPriceAmount: 12,
          renewalDate: "2026-05-27",
        }),
      ],
      fromDate,
      45,
    );

    expect(
      charges.map((charge) => [charge.subscription.id, charge.date, charge.amount]),
    ).toEqual([
      ["sooner", "2026-05-21", 10],
      ["trial", "2026-05-27", 12],
      ["later", "2026-06-01", 10],
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
