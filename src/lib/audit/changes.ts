import { formatCurrency, formatDate } from "@/lib/format";
import type { Subscription } from "@/lib/subscriptions/types";

export type SubscriptionFieldChange = {
  field: string;
  summary: string;
};

// Fields worth narrating in the audit trail; everything else is captured by
// the generic "details updated" fallback.
export function diffSubscription(
  before: Subscription,
  after: Subscription,
): SubscriptionFieldChange[] {
  const changes: SubscriptionFieldChange[] = [];

  if (before.providerName !== after.providerName) {
    changes.push({
      field: "providerName",
      summary: `renamed from "${before.providerName}" to "${after.providerName}"`,
    });
  }

  if (before.status !== after.status) {
    changes.push({
      field: "status",
      summary: `status ${before.status} -> ${after.status}`,
    });
  }

  if (before.priceAmount !== after.priceAmount) {
    changes.push({
      field: "priceAmount",
      summary: `price ${formatCurrency(before.priceAmount, before.currency)} -> ${formatCurrency(
        after.priceAmount,
        after.currency,
      )}`,
    });
  }

  if (
    before.billingCadence !== after.billingCadence ||
    (before.intervalDays ?? null) !== (after.intervalDays ?? null)
  ) {
    changes.push({
      field: "billingCadence",
      summary: `cadence ${before.billingCadence} -> ${after.billingCadence}`,
    });
  }

  if ((before.renewalDate ?? null) !== (after.renewalDate ?? null)) {
    changes.push({
      field: "renewalDate",
      summary: `renewal ${formatDate(before.renewalDate)} -> ${formatDate(after.renewalDate)}`,
    });
  }

  if (before.category !== after.category) {
    changes.push({
      field: "category",
      summary: `category ${before.category} -> ${after.category}`,
    });
  }

  if ((before.cancelByDate ?? null) !== (after.cancelByDate ?? null)) {
    changes.push({
      field: "cancelByDate",
      summary: `cancel-by ${formatDate(before.cancelByDate)} -> ${formatDate(after.cancelByDate)}`,
    });
  }

  return changes;
}

export function summarizeSubscriptionUpdate(
  subscription: Subscription,
  changes: SubscriptionFieldChange[],
): string {
  if (changes.length === 0) {
    return `${subscription.providerName}: details updated`;
  }

  return `${subscription.providerName}: ${changes
    .map((change) => change.summary)
    .join(", ")}`;
}
