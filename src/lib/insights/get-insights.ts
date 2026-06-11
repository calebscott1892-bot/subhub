import type { Subscription } from "@/lib/subscriptions/types";
import {
  findUpcomingAnnualRenewals,
  type AnnualRenewalInsight,
} from "./annual-renewals";
import {
  findDuplicateSubscriptions,
  type DuplicateGroup,
} from "./duplicates";
import {
  findUnderusedSubscriptions,
  type UnderusedInsight,
} from "./underused";

export type SubscriptionInsights = {
  underused: UnderusedInsight[];
  duplicates: DuplicateGroup[];
  annualRenewals: AnnualRenewalInsight[];
  insightCount: number;
};

export function getSubscriptionInsights(
  subscriptions: Subscription[],
  fromDate: string,
): SubscriptionInsights {
  const underused = findUnderusedSubscriptions(subscriptions, fromDate);
  const duplicates = findDuplicateSubscriptions(subscriptions);
  const annualRenewals = findUpcomingAnnualRenewals(subscriptions, fromDate);

  return {
    underused,
    duplicates,
    annualRenewals,
    insightCount: underused.length + duplicates.length + annualRenewals.length,
  };
}
