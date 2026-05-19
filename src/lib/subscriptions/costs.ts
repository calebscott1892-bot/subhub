import type { BillingCadence, Subscription } from "./types";

type CostInput = {
  priceAmount: number;
  billingCadence: BillingCadence;
  intervalDays?: number | null;
};

const ACTIVE_SPEND_STATUSES = new Set<Subscription["status"]>([
  "Active",
  "Trial",
  "Paused",
]);

export function calculateMonthlyCost(input: CostInput): number {
  const amount = input.priceAmount;

  if (input.billingCadence === "Monthly") {
    return roundCurrency(amount);
  }

  if (input.billingCadence === "Yearly") {
    return roundCurrency(amount / 12);
  }

  if (input.billingCadence === "Weekly") {
    return roundCurrency((amount * 52) / 12);
  }

  if (!input.intervalDays || input.intervalDays <= 0) {
    return 0;
  }

  return roundCurrency(((amount * 365) / input.intervalDays) / 12);
}

export function calculateAnnualCost(input: CostInput): number {
  const amount = input.priceAmount;

  if (input.billingCadence === "Monthly") {
    return roundCurrency(amount * 12);
  }

  if (input.billingCadence === "Yearly") {
    return roundCurrency(amount);
  }

  if (input.billingCadence === "Weekly") {
    return roundCurrency(amount * 52);
  }

  if (!input.intervalDays || input.intervalDays <= 0) {
    return 0;
  }

  return roundCurrency((amount * 365) / input.intervalDays);
}

export function summarizeSubscriptionSpend(subscriptions: Subscription[]) {
  const activeSubscriptions = subscriptions.filter((subscription) =>
    ACTIVE_SPEND_STATUSES.has(subscription.status),
  );

  return activeSubscriptions.reduce(
    (summary, subscription) => ({
      activeCount: summary.activeCount + 1,
      monthlyTotal: roundCurrency(
        summary.monthlyTotal + calculateMonthlyCost(subscription),
      ),
      annualTotal: roundCurrency(
        summary.annualTotal + calculateAnnualCost(subscription),
      ),
    }),
    { activeCount: 0, monthlyTotal: 0, annualTotal: 0 },
  );
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
