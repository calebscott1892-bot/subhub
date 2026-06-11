import { roundCurrency } from "@/lib/subscriptions/costs";
import type { SplitType } from "@/lib/subscriptions/types";

export type ShareAllocation = {
  memberId: string;
  fixedAmount?: number | null;
  percentage?: number | null;
};

export type MemberAmount = {
  memberId: string;
  amount: number;
};

export type SplitResult =
  | { ok: true; ownerAmount: number; memberAmounts: MemberAmount[] }
  | { ok: false; error: string };

export function computeSplit(
  total: number,
  splitType: SplitType,
  shares: ShareAllocation[],
): SplitResult {
  if (!Number.isFinite(total) || total < 0) {
    return { ok: false, error: "The amount to split must be zero or greater." };
  }

  if (shares.length === 0) {
    return { ok: true, ownerAmount: roundCurrency(total), memberAmounts: [] };
  }

  if (splitType === "Equal") {
    const perMember = roundCurrency(total / (shares.length + 1));

    return {
      ok: true,
      // The owner absorbs rounding so the split always adds up to the total.
      ownerAmount: roundCurrency(total - perMember * shares.length),
      memberAmounts: shares.map((share) => ({
        memberId: share.memberId,
        amount: perMember,
      })),
    };
  }

  if (splitType === "Fixed") {
    if (shares.some((share) => !isValidAmount(share.fixedAmount))) {
      return {
        ok: false,
        error: "Each included member needs a fixed amount of zero or greater.",
      };
    }

    const memberAmounts = shares.map((share) => ({
      memberId: share.memberId,
      amount: roundCurrency(share.fixedAmount ?? 0),
    }));
    const memberTotal = roundCurrency(
      memberAmounts.reduce((sum, share) => sum + share.amount, 0),
    );

    if (memberTotal > total) {
      return {
        ok: false,
        error: "Fixed shares add up to more than the cost being split.",
      };
    }

    return {
      ok: true,
      ownerAmount: roundCurrency(total - memberTotal),
      memberAmounts,
    };
  }

  if (
    shares.some(
      (share) =>
        !isValidAmount(share.percentage) || (share.percentage ?? 0) > 100,
    )
  ) {
    return {
      ok: false,
      error: "Each included member needs a percentage between 0 and 100.",
    };
  }

  const percentageTotal = shares.reduce(
    (sum, share) => sum + (share.percentage ?? 0),
    0,
  );

  if (percentageTotal > 100.000001) {
    return { ok: false, error: "Percentages add up to more than 100%." };
  }

  const memberAmounts = shares.map((share) => ({
    memberId: share.memberId,
    amount: roundCurrency((total * (share.percentage ?? 0)) / 100),
  }));
  const memberTotal = memberAmounts.reduce((sum, share) => sum + share.amount, 0);

  return {
    ok: true,
    ownerAmount: Math.max(roundCurrency(total - memberTotal), 0),
    memberAmounts,
  };
}

function isValidAmount(value: number | null | undefined): boolean {
  return value != null && Number.isFinite(value) && value >= 0;
}
