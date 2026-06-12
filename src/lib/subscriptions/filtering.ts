import { calculateMonthlyCost } from "./costs";
import type { Subscription } from "./types";

export const LIST_SORTS = ["renewal", "price", "name", "updated"] as const;

export type ListSort = (typeof LIST_SORTS)[number];

export type SubscriptionListQuery = {
  q: string;
  status: string;
  category: string;
  cadence: string;
  sharing: "" | "personal" | "shared";
  sort: ListSort;
};

const DEFAULT_SORT: ListSort = "renewal";

export function parseListQuery(
  params: Record<string, string | undefined>,
): SubscriptionListQuery {
  const sharing =
    params.sharing === "personal" || params.sharing === "shared"
      ? params.sharing
      : "";
  const sort = (LIST_SORTS as readonly string[]).includes(params.sort ?? "")
    ? (params.sort as ListSort)
    : DEFAULT_SORT;

  return {
    q: (params.q ?? "").trim(),
    status: params.status ?? "",
    category: params.category ?? "",
    cadence: params.cadence ?? "",
    sharing,
    sort,
  };
}

export function hasActiveFilters(query: SubscriptionListQuery): boolean {
  return Boolean(
    query.q ||
      query.status ||
      query.category ||
      query.cadence ||
      query.sharing ||
      query.sort !== DEFAULT_SORT,
  );
}

export function filterAndSortSubscriptions(
  subscriptions: Subscription[],
  query: SubscriptionListQuery,
): Subscription[] {
  const search = query.q.toLowerCase();

  const filtered = subscriptions.filter((subscription) => {
    if (search && !matchesSearch(subscription, search)) {
      return false;
    }

    if (query.status && subscription.status !== query.status) {
      return false;
    }

    if (query.category && subscription.category !== query.category) {
      return false;
    }

    if (query.cadence && subscription.billingCadence !== query.cadence) {
      return false;
    }

    if (query.sharing === "personal" && subscription.isShared) {
      return false;
    }

    if (query.sharing === "shared" && !subscription.isShared) {
      return false;
    }

    return true;
  });

  return sortSubscriptions(filtered, query.sort);
}

function matchesSearch(subscription: Subscription, search: string): boolean {
  return [
    subscription.providerName,
    subscription.accountEmailForProvider ?? "",
    subscription.notes ?? "",
    subscription.category,
  ].some((value) => value.toLowerCase().includes(search));
}

function sortSubscriptions(
  subscriptions: Subscription[],
  sort: ListSort,
): Subscription[] {
  const sorted = [...subscriptions];

  if (sort === "price") {
    return sorted.sort(
      (left, right) =>
        calculateMonthlyCost(right) - calculateMonthlyCost(left) ||
        left.providerName.localeCompare(right.providerName),
    );
  }

  if (sort === "name") {
    return sorted.sort((left, right) =>
      left.providerName.localeCompare(right.providerName),
    );
  }

  if (sort === "updated") {
    return sorted.sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
  }

  // Renewal: soonest first, undated subscriptions last.
  return sorted.sort((left, right) => {
    if (!left.renewalDate && !right.renewalDate) {
      return left.providerName.localeCompare(right.providerName);
    }

    if (!left.renewalDate) {
      return 1;
    }

    if (!right.renewalDate) {
      return -1;
    }

    return (
      left.renewalDate.localeCompare(right.renewalDate) ||
      left.providerName.localeCompare(right.providerName)
    );
  });
}
