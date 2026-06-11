import {
  calculateMonthlyCost,
  isCountedInSpend,
} from "@/lib/subscriptions/costs";
import { daysUntil } from "@/lib/subscriptions/dates";
import type { Subscription } from "@/lib/subscriptions/types";

export const UNDERUSED_THRESHOLD_DAYS = 45;

export type UnderusedInsight = {
  subscription: Subscription;
  daysSinceLastUse: number;
  monthlyCost: number;
};

export function findUnderusedSubscriptions(
  subscriptions: Subscription[],
  fromDate: string,
  thresholdDays = UNDERUSED_THRESHOLD_DAYS,
): UnderusedInsight[] {
  return subscriptions
    .filter(
      (subscription) =>
        isCountedInSpend(subscription.status) && subscription.lastUsageDate,
    )
    .map((subscription) => ({
      subscription,
      daysSinceLastUse: -daysUntil(String(subscription.lastUsageDate), fromDate),
      monthlyCost: calculateMonthlyCost(subscription),
    }))
    .filter(
      (insight) =>
        Number.isFinite(insight.daysSinceLastUse) &&
        insight.daysSinceLastUse >= thresholdDays,
    )
    .sort((left, right) => right.daysSinceLastUse - left.daysSinceLastUse);
}
