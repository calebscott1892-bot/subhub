import {
  calculateMonthlyCost,
  isCountedInSpend,
  roundCurrency,
} from "@/lib/subscriptions/costs";
import type { Subscription } from "@/lib/subscriptions/types";

const OVERLAP_PRONE_CATEGORIES = new Set([
  "Streaming",
  "Music",
  "Storage",
  "News",
  "Gaming",
]);

export type DuplicateGroup = {
  kind: "provider" | "category";
  label: string;
  subscriptions: Subscription[];
  combinedMonthlyCost: number;
};

export function findDuplicateSubscriptions(
  subscriptions: Subscription[],
): DuplicateGroup[] {
  const counted = subscriptions.filter((subscription) =>
    isCountedInSpend(subscription.status),
  );

  const providerGroups = groupBy(counted, (subscription) =>
    normalizeProviderName(subscription.providerName),
  )
    .filter((group) => group.length > 1)
    .map((group) => buildGroup("provider", group[0].providerName, group));

  const providerGroupIds = providerGroups.map((group) =>
    memberKey(group.subscriptions),
  );

  const categoryGroups = groupBy(
    counted.filter((subscription) =>
      OVERLAP_PRONE_CATEGORIES.has(subscription.category),
    ),
    (subscription) => subscription.category,
  )
    .filter((group) => group.length > 1)
    // Same providers twice is already a provider duplicate; do not report it again.
    .filter((group) => !providerGroupIds.includes(memberKey(group)))
    .map((group) => buildGroup("category", group[0].category, group));

  return [...providerGroups, ...categoryGroups].sort(
    (left, right) => right.combinedMonthlyCost - left.combinedMonthlyCost,
  );
}

function buildGroup(
  kind: DuplicateGroup["kind"],
  label: string,
  subscriptions: Subscription[],
): DuplicateGroup {
  return {
    kind,
    label,
    subscriptions,
    combinedMonthlyCost: roundCurrency(
      subscriptions.reduce(
        (total, subscription) => total + calculateMonthlyCost(subscription),
        0,
      ),
    ),
  };
}

function groupBy(
  subscriptions: Subscription[],
  keyOf: (subscription: Subscription) => string,
): Subscription[][] {
  const groups = new Map<string, Subscription[]>();

  for (const subscription of subscriptions) {
    const key = keyOf(subscription);
    const group = groups.get(key) ?? [];
    group.push(subscription);
    groups.set(key, group);
  }

  return [...groups.values()];
}

function memberKey(subscriptions: Subscription[]): string {
  return subscriptions
    .map((subscription) => subscription.id)
    .sort()
    .join("|");
}

function normalizeProviderName(providerName: string): string {
  return providerName.toLowerCase().replace(/[^a-z0-9]/g, "");
}
