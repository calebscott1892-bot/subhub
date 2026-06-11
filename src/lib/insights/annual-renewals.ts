import { chargeAmountFor, isCountedInSpend } from "@/lib/subscriptions/costs";
import { daysUntil } from "@/lib/subscriptions/dates";
import type { Subscription } from "@/lib/subscriptions/types";

export const ANNUAL_RENEWAL_WINDOW_DAYS = 60;

export type AnnualRenewalInsight = {
  subscription: Subscription;
  daysAway: number;
  amount: number;
};

export function findUpcomingAnnualRenewals(
  subscriptions: Subscription[],
  fromDate: string,
  windowDays = ANNUAL_RENEWAL_WINDOW_DAYS,
): AnnualRenewalInsight[] {
  return subscriptions
    .filter(
      (subscription) =>
        isCountedInSpend(subscription.status) &&
        subscription.billingCadence === "Yearly" &&
        subscription.renewalDate,
    )
    .map((subscription) => ({
      subscription,
      daysAway: daysUntil(String(subscription.renewalDate), fromDate),
      amount: chargeAmountFor(subscription),
    }))
    .filter(
      (insight) =>
        Number.isFinite(insight.daysAway) &&
        insight.daysAway >= 0 &&
        insight.daysAway <= windowDays,
    )
    .sort((left, right) => left.daysAway - right.daysAway);
}
