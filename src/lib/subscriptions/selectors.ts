import { summarizeSubscriptionSpend } from "./costs";
import { daysUntil, getUpcomingRenewals } from "./dates";
import type { Subscription } from "./types";

export function getDashboardMetrics(
  subscriptions: Subscription[],
  fromDate: string,
) {
  const spend = summarizeSubscriptionSpend(subscriptions);
  const [nextRenewal = null] = getUpcomingRenewals(
    subscriptions,
    fromDate,
    3650,
  );

  return {
    ...spend,
    nextRenewal,
    trialsEndingSoonCount: getTrialsEndingSoon(subscriptions, fromDate, 14)
      .length,
  };
}

export function getTrialsEndingSoon(
  subscriptions: Subscription[],
  fromDate: string,
  windowDays: number,
): Subscription[] {
  return subscriptions
    .filter((subscription) => {
      if (subscription.status !== "Trial") {
        return false;
      }

      const deadline = getTrialDeadline(subscription);

      if (!deadline) {
        return false;
      }

      const daysAway = daysUntil(deadline, fromDate);
      return daysAway >= 0 && daysAway <= windowDays;
    })
    .sort((left, right) =>
      String(getTrialDeadline(left)).localeCompare(
        String(getTrialDeadline(right)),
      ),
    );
}

export function getTrialDeadline(subscription: Subscription): string | null {
  return subscription.cancelByDate || subscription.trialEndDate || null;
}
