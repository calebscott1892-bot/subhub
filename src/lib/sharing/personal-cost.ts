import {
  calculateMonthlyCost,
  isCountedInSpend,
  roundCurrency,
} from "@/lib/subscriptions/costs";
import type { Subscription } from "@/lib/subscriptions/types";
import { computeSplit, type ShareAllocation } from "./split-rules";

export type SharesBySubscription = Map<string, ShareAllocation[]>;

export function personalMonthlyCost(
  subscription: Subscription,
  shares: ShareAllocation[],
): number {
  const gross = calculateMonthlyCost(subscription);

  if (!subscription.isShared || !subscription.splitType || shares.length === 0) {
    return gross;
  }

  const split = computeSplit(gross, subscription.splitType, shares);

  // An invalid stored split falls back to the gross cost rather than hiding spend.
  return split.ok ? split.ownerAmount : gross;
}

export function summarizeSharedSpend(
  subscriptions: Subscription[],
  sharesBySubscription: SharesBySubscription,
): { grossMonthly: number; personalMonthly: number; sharedCount: number } {
  let grossMonthly = 0;
  let personalMonthly = 0;
  let sharedCount = 0;

  for (const subscription of subscriptions) {
    if (!isCountedInSpend(subscription.status)) {
      continue;
    }

    const shares = sharesBySubscription.get(subscription.id) ?? [];
    const gross = calculateMonthlyCost(subscription);
    const personal = personalMonthlyCost(subscription, shares);

    grossMonthly = roundCurrency(grossMonthly + gross);
    personalMonthly = roundCurrency(personalMonthly + personal);

    if (subscription.isShared && shares.length > 0) {
      sharedCount += 1;
    }
  }

  return { grossMonthly, personalMonthly, sharedCount };
}

export function memberMonthlyTotals(
  subscriptions: Subscription[],
  sharesBySubscription: SharesBySubscription,
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const subscription of subscriptions) {
    if (!isCountedInSpend(subscription.status)) {
      continue;
    }

    if (!subscription.isShared || !subscription.splitType) {
      continue;
    }

    const shares = sharesBySubscription.get(subscription.id) ?? [];

    if (shares.length === 0) {
      continue;
    }

    const split = computeSplit(
      calculateMonthlyCost(subscription),
      subscription.splitType,
      shares,
    );

    if (!split.ok) {
      continue;
    }

    for (const memberAmount of split.memberAmounts) {
      totals.set(
        memberAmount.memberId,
        roundCurrency((totals.get(memberAmount.memberId) ?? 0) + memberAmount.amount),
      );
    }
  }

  return totals;
}
