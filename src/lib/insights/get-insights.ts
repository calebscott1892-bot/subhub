import type { PriceChange } from "@/lib/subscriptions/price-history";
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
  findRecentPriceIncreases,
  type PriceIncreaseInsight,
} from "./price-increases";
import {
  findUnderusedSubscriptions,
  type UnderusedInsight,
} from "./underused";

export type SubscriptionPriceIncrease = PriceIncreaseInsight & {
  subscription: Subscription;
};

export type SubscriptionInsights = {
  underused: UnderusedInsight[];
  duplicates: DuplicateGroup[];
  annualRenewals: AnnualRenewalInsight[];
  priceIncreases: SubscriptionPriceIncrease[];
  insightCount: number;
};

export function getSubscriptionInsights(
  subscriptions: Subscription[],
  fromDate: string,
  priceChanges: PriceChange[] = [],
): SubscriptionInsights {
  const subscriptionById = new Map(
    subscriptions.map((subscription) => [subscription.id, subscription]),
  );
  const underused = findUnderusedSubscriptions(subscriptions, fromDate);
  const duplicates = findDuplicateSubscriptions(subscriptions);
  const annualRenewals = findUpcomingAnnualRenewals(subscriptions, fromDate);
  const priceIncreases = findRecentPriceIncreases(priceChanges, fromDate)
    .map((insight) => ({
      ...insight,
      subscription: subscriptionById.get(insight.priceChange.subscriptionId),
    }))
    .filter(
      (insight): insight is SubscriptionPriceIncrease =>
        insight.subscription !== undefined,
    );

  return {
    underused,
    duplicates,
    annualRenewals,
    priceIncreases,
    insightCount:
      underused.length +
      duplicates.length +
      annualRenewals.length +
      priceIncreases.length,
  };
}
