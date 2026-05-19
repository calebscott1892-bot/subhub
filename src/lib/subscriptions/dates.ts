import type { BillingCadence, Subscription } from "./types";

const ACTIVE_RENEWAL_STATUSES = new Set<Subscription["status"]>([
  "Active",
  "Trial",
  "Paused",
]);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function calculateNextRenewalDate(
  renewalDate: string | null,
  billingCadence: BillingCadence,
  intervalDays?: number | null,
): string | null {
  if (!renewalDate) {
    return null;
  }

  const date = parseDateOnly(renewalDate);

  if (!date) {
    return null;
  }

  if (billingCadence === "Monthly") {
    return formatDateOnly(addMonths(date, 1));
  }

  if (billingCadence === "Yearly") {
    return formatDateOnly(addMonths(date, 12));
  }

  if (billingCadence === "Weekly") {
    return formatDateOnly(addDays(date, 7));
  }

  if (!intervalDays || intervalDays <= 0) {
    return null;
  }

  return formatDateOnly(addDays(date, intervalDays));
}

export function daysUntil(targetDate: string, fromDate: string): number {
  const target = parseDateOnly(targetDate);
  const from = parseDateOnly(fromDate);

  if (!target || !from) {
    return Number.NaN;
  }

  return Math.round((target.getTime() - from.getTime()) / MS_PER_DAY);
}

export function getUpcomingRenewals(
  subscriptions: Subscription[],
  fromDate: string,
  windowDays: number,
): Subscription[] {
  return subscriptions
    .filter((subscription) => {
      if (!subscription.renewalDate) {
        return false;
      }

      if (!ACTIVE_RENEWAL_STATUSES.has(subscription.status)) {
        return false;
      }

      const daysAway = daysUntil(subscription.renewalDate, fromDate);
      return daysAway >= 0 && daysAway <= windowDays;
    })
    .sort((left, right) =>
      String(left.renewalDate).localeCompare(String(right.renewalDate)),
    );
}

function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, monthIndex, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== monthIndex ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function addMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth() + months;
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;
  const targetDay = Math.min(
    date.getUTCDate(),
    getLastDayOfMonth(targetYear, targetMonth),
  );

  return new Date(Date.UTC(targetYear, targetMonth, targetDay));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function getLastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
