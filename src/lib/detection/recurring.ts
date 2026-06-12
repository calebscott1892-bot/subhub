import { roundCurrency } from "@/lib/subscriptions/costs";
import { calculateNextRenewalDate, daysUntil } from "@/lib/subscriptions/dates";
import type {
  BillingCadence,
  Subscription,
  SubscriptionCategory,
} from "@/lib/subscriptions/types";
import type { BankTransaction } from "./parse-transactions";

export type CandidateEvidence = {
  date: string;
  description: string;
  amount: number;
};

export type RecurringCandidate = {
  merchantLabel: string;
  normalizedMerchant: string;
  billingCadence: BillingCadence;
  intervalDays: number | null;
  lastAmount: number;
  averageAmount: number;
  occurrenceCount: number;
  firstChargeDate: string;
  lastChargeDate: string;
  nextEstimatedCharge: string | null;
  confidence: number;
  categoryGuess: SubscriptionCategory;
  evidence: CandidateEvidence[];
  matchedSubscriptionId: string | null;
};

const CATEGORY_KEYWORDS: Array<[SubscriptionCategory, string[]]> = [
  ["Streaming", ["netflix", "disney", "hulu", "stan", "binge", "paramount", "hbo", "youtube", "prime video"]],
  ["Music", ["spotify", "apple music", "tidal", "deezer", "soundcloud"]],
  ["Storage", ["icloud", "dropbox", "google one", "onedrive", "backblaze"]],
  ["Software", ["adobe", "microsoft 365", "notion", "figma", "github", "openai", "anthropic", "canva", "jetbrains"]],
  ["Gaming", ["xbox", "playstation", "nintendo", "steam", "game pass"]],
  ["Health", ["gym", "fitness", "anytime", "yoga", "pilates"]],
  ["News", ["news", "times", "herald", "post", "guardian"]],
  ["Utilities", ["energy", "power", "water", "internet", "telstra", "optus", "vodafone"]],
];

export function detectRecurringCharges(
  transactions: BankTransaction[],
  existingSubscriptions: Subscription[] = [],
): RecurringCandidate[] {
  const groups = new Map<string, BankTransaction[]>();

  for (const transaction of transactions) {
    const key = normalizeMerchant(transaction.description);

    if (!key) {
      continue;
    }

    const group = groups.get(key) ?? [];
    group.push(transaction);
    groups.set(key, group);
  }

  const candidates: RecurringCandidate[] = [];

  for (const [normalizedMerchant, group] of groups) {
    const candidate = analyzeGroup(normalizedMerchant, group);

    if (candidate) {
      candidate.matchedSubscriptionId = findMatchingSubscription(
        normalizedMerchant,
        existingSubscriptions,
      );
      candidates.push(candidate);
    }
  }

  return candidates.sort(
    (left, right) =>
      right.confidence - left.confidence ||
      left.merchantLabel.localeCompare(right.merchantLabel),
  );
}

function analyzeGroup(
  normalizedMerchant: string,
  group: BankTransaction[],
): RecurringCandidate | null {
  const charges = [...group].sort((left, right) =>
    left.date.localeCompare(right.date),
  );

  const gaps: number[] = [];

  for (let index = 1; index < charges.length; index += 1) {
    const gap = daysUntil(charges[index].date, charges[index - 1].date);

    if (Number.isFinite(gap) && gap > 0) {
      gaps.push(gap);
    }
  }

  if (gaps.length === 0) {
    return null;
  }

  const medianGap = median(gaps);
  const maxDeviation = Math.max(
    ...gaps.map((gap) => Math.abs(gap - medianGap)),
  );
  const cadence = classifyCadence(medianGap, maxDeviation);

  if (!cadence) {
    return null;
  }

  const amounts = charges.map((charge) => charge.amount);
  const medianAmount = median(amounts);

  if (medianAmount <= 0) {
    return null;
  }

  const amountSpread = Math.max(...amounts) - Math.min(...amounts);
  const amountScore = clamp(1 - amountSpread / medianAmount, 0, 1);

  // Wildly varying amounts are purchases, not a subscription.
  if (amountScore < 0.5) {
    return null;
  }

  const regularityScore = clamp(
    1 - maxDeviation / Math.max(medianGap, 1),
    0,
    1,
  );
  const occurrenceScore = clamp((charges.length - 1) / 3, 0, 1);
  const confidence =
    Math.round(
      (0.3 + 0.3 * regularityScore + 0.2 * amountScore + 0.2 * occurrenceScore) *
        100,
    ) / 100;

  const lastCharge = charges[charges.length - 1];

  return {
    merchantLabel: mostCommonDescription(charges),
    normalizedMerchant,
    billingCadence: cadence.billingCadence,
    intervalDays: cadence.intervalDays,
    lastAmount: roundCurrency(lastCharge.amount),
    averageAmount: roundCurrency(
      amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length,
    ),
    occurrenceCount: charges.length,
    firstChargeDate: charges[0].date,
    lastChargeDate: lastCharge.date,
    nextEstimatedCharge: calculateNextRenewalDate(
      lastCharge.date,
      cadence.billingCadence,
      cadence.intervalDays,
    ),
    confidence,
    categoryGuess: guessCategory(normalizedMerchant),
    evidence: charges.map((charge) => ({
      date: charge.date,
      description: charge.description,
      amount: roundCurrency(charge.amount),
    })),
    matchedSubscriptionId: null,
  };
}

function classifyCadence(
  medianGap: number,
  maxDeviation: number,
): { billingCadence: BillingCadence; intervalDays: number | null } | null {
  const tolerance = Math.max(3, medianGap * 0.2);

  if (maxDeviation > tolerance && !(medianGap >= 350 && maxDeviation <= 15)) {
    return null;
  }

  if (medianGap >= 5 && medianGap <= 9) {
    return { billingCadence: "Weekly", intervalDays: null };
  }

  if (medianGap >= 25 && medianGap <= 35) {
    return { billingCadence: "Monthly", intervalDays: null };
  }

  if (medianGap >= 350 && medianGap <= 380) {
    return { billingCadence: "Yearly", intervalDays: null };
  }

  if (medianGap >= 2) {
    return { billingCadence: "Custom", intervalDays: Math.round(medianGap) };
  }

  return null;
}

export function normalizeMerchant(description: string): string {
  return description
    .toLowerCase()
    .replace(/^(sq|square|paypal|pp|pos|visa purchase|eftpos|direct debit|dd)\b[\s*:-]*/, "")
    .replace(/[^a-z]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findMatchingSubscription(
  normalizedMerchant: string,
  subscriptions: Subscription[],
): string | null {
  for (const subscription of subscriptions) {
    const normalizedProvider = normalizeMerchant(subscription.providerName);

    if (!normalizedProvider) {
      continue;
    }

    if (
      normalizedMerchant.includes(normalizedProvider) ||
      normalizedProvider.includes(normalizedMerchant) ||
      sharesLeadingWord(normalizedMerchant, normalizedProvider)
    ) {
      return subscription.id;
    }
  }

  return null;
}

function sharesLeadingWord(left: string, right: string): boolean {
  const leftWord = left.split(" ")[0];
  const rightWord = right.split(" ")[0];

  return leftWord.length >= 4 && leftWord === rightWord;
}

function guessCategory(normalizedMerchant: string): SubscriptionCategory {
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => normalizedMerchant.includes(keyword))) {
      return category;
    }
  }

  return "Other";
}

function mostCommonDescription(charges: BankTransaction[]): string {
  const counts = new Map<string, number>();

  for (const charge of charges) {
    counts.set(charge.description, (counts.get(charge.description) ?? 0) + 1);
  }

  let best = charges[0].description;
  let bestCount = 0;

  for (const [description, count] of counts) {
    if (count > bestCount) {
      best = description;
      bestCount = count;
    }
  }

  return best;
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
