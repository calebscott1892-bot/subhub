import type { HouseholdMember } from "@/lib/household/repository";
import type { SplitType } from "@/lib/subscriptions/types";
import type { ShareAllocation } from "./split-rules";

export type SharingFormResult =
  | {
      ok: true;
      data: { splitType: SplitType | null; shares: ShareAllocation[] };
      errors?: never;
    }
  | { ok: false; data?: never; errors: Record<string, string> };

const SPLIT_TYPES = new Set<SplitType>(["Equal", "Fixed", "Percentage"]);

export function shareFieldName(
  kind: "include" | "amount" | "percentage",
  memberId: string,
): string {
  return `share-${kind}-${memberId}`;
}

export function parseSharingFormData(
  formData: FormData,
  members: HouseholdMember[],
): SharingFormResult {
  const splitTypeValue = String(formData.get("splitType") ?? "None");

  if (splitTypeValue === "None") {
    return { ok: true, data: { splitType: null, shares: [] } };
  }

  if (!SPLIT_TYPES.has(splitTypeValue as SplitType)) {
    return { ok: false, errors: { splitType: "Choose a supported split type." } };
  }

  const splitType = splitTypeValue as SplitType;
  const errors: Record<string, string> = {};
  const shares: ShareAllocation[] = [];

  for (const member of members) {
    if (splitType === "Equal") {
      if (formData.get(shareFieldName("include", member.id))) {
        shares.push({ memberId: member.id });
      }
      continue;
    }

    const fieldKind = splitType === "Fixed" ? "amount" : "percentage";
    const fieldName = shareFieldName(fieldKind, member.id);
    const raw = String(formData.get(fieldName) ?? "").trim();

    if (!raw) {
      continue;
    }

    const parsed = Number(raw);

    if (!Number.isFinite(parsed) || parsed < 0) {
      errors[fieldName] =
        `${member.name}'s share must be zero or greater.`;
      continue;
    }

    if (splitType === "Percentage" && parsed > 100) {
      errors[fieldName] = `${member.name}'s share cannot exceed 100%.`;
      continue;
    }

    shares.push(
      splitType === "Fixed"
        ? { memberId: member.id, fixedAmount: parsed }
        : { memberId: member.id, percentage: parsed },
    );
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  if (shares.length === 0) {
    return { ok: true, data: { splitType: null, shares: [] } };
  }

  return { ok: true, data: { splitType, shares } };
}
