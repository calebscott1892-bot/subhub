import {
  chargeAmountFor,
  isCountedInSpend,
  roundCurrency,
} from "@/lib/subscriptions/costs";
import { calculateNextRenewalDate, daysUntil } from "@/lib/subscriptions/dates";
import type { Subscription } from "@/lib/subscriptions/types";

const MAX_SCHEDULE_STEPS = 5000;

export type ForecastCharge = {
  subscriptionId: string;
  providerName: string;
  category: string;
  date: string;
  amount: number;
};

export type ForecastMonth = {
  month: string;
  label: string;
  total: number;
  charges: ForecastCharge[];
};

export type ChargeForecast = {
  months: ForecastMonth[];
  scheduledCount: number;
  unscheduledCount: number;
};

export type NextCharge = {
  subscription: Subscription;
  date: string;
  amount: number;
};

export function getNextCharge(
  subscription: Subscription,
  fromDate: string,
): NextCharge | null {
  if (!isCountedInSpend(subscription.status)) {
    return null;
  }

  const date = firstChargeDateOnOrAfter(subscription, fromDate);

  return date
    ? { subscription, date, amount: chargeAmountFor(subscription) }
    : null;
}

export function getUpcomingCharges(
  subscriptions: Subscription[],
  fromDate: string,
  windowDays: number,
): NextCharge[] {
  return subscriptions
    .map((subscription) => getNextCharge(subscription, fromDate))
    .filter((charge): charge is NextCharge => charge !== null)
    .filter((charge) => daysUntil(charge.date, fromDate) <= windowDays)
    .sort(
      (left, right) =>
        left.date.localeCompare(right.date) ||
        left.subscription.providerName.localeCompare(
          right.subscription.providerName,
        ),
    );
}

export function buildChargeForecast(
  subscriptions: Subscription[],
  fromDate: string,
  monthsAhead = 6,
): ChargeForecast {
  const monthKeys = buildMonthWindow(fromDate, monthsAhead);
  const horizonEnd = lastDayOfMonthKey(monthKeys[monthKeys.length - 1]);
  const chargesByMonth = new Map<string, ForecastCharge[]>(
    monthKeys.map((key) => [key, []]),
  );

  let scheduledCount = 0;
  let unscheduledCount = 0;

  for (const subscription of subscriptions) {
    if (!isCountedInSpend(subscription.status)) {
      continue;
    }

    const chargeDates = projectChargeDates(subscription, fromDate, horizonEnd);

    if (chargeDates === null) {
      unscheduledCount += 1;
      continue;
    }

    scheduledCount += 1;
    const amount = chargeAmountFor(subscription);

    for (const date of chargeDates) {
      chargesByMonth.get(date.slice(0, 7))?.push({
        subscriptionId: subscription.id,
        providerName: subscription.providerName,
        category: subscription.category,
        date,
        amount,
      });
    }
  }

  const months = monthKeys.map((month) => {
    const charges = (chargesByMonth.get(month) ?? []).sort(
      (left, right) =>
        left.date.localeCompare(right.date) ||
        left.providerName.localeCompare(right.providerName),
    );

    return {
      month,
      label: formatMonthLabel(month),
      total: roundCurrency(
        charges.reduce((total, charge) => total + charge.amount, 0),
      ),
      charges,
    };
  });

  return { months, scheduledCount, unscheduledCount };
}

function firstChargeDateOnOrAfter(
  subscription: Subscription,
  fromDate: string,
): string | null {
  let current: string | null = subscription.renewalDate;

  for (let step = 0; current && step < MAX_SCHEDULE_STEPS; step += 1) {
    if (current >= fromDate) {
      return current;
    }

    const next: string | null = calculateNextRenewalDate(
      current,
      subscription.billingCadence,
      subscription.intervalDays,
    );

    if (!next || next <= current) {
      return null;
    }

    current = next;
  }

  return null;
}

function projectChargeDates(
  subscription: Subscription,
  fromDate: string,
  horizonEnd: string,
): string[] | null {
  const firstDate = firstChargeDateOnOrAfter(subscription, fromDate);

  if (!firstDate) {
    return null;
  }

  const dates: string[] = [];
  let current: string | null = firstDate;

  for (let step = 0; current && step < MAX_SCHEDULE_STEPS; step += 1) {
    if (current > horizonEnd) {
      break;
    }

    dates.push(current);

    const next: string | null = calculateNextRenewalDate(
      current,
      subscription.billingCadence,
      subscription.intervalDays,
    );

    if (!next || next <= current) {
      break;
    }

    current = next;
  }

  return dates;
}

function buildMonthWindow(fromDate: string, monthsAhead: number): string[] {
  const [year, month] = fromDate.split("-").map(Number);

  return Array.from({ length: Math.max(monthsAhead, 1) }, (_, offset) => {
    const date = new Date(Date.UTC(year, month - 1 + offset, 1));
    return date.toISOString().slice(0, 7);
  });
}

function lastDayOfMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
