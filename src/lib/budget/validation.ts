import { SUBSCRIPTION_CATEGORIES } from "@/lib/subscriptions/types";
import type { SaveBudgetTargetsInput } from "./repository";

export type BudgetValidationResult =
  | { ok: true; data: SaveBudgetTargetsInput; errors?: never }
  | { ok: false; data?: never; errors: Record<string, string> };

export function categoryTargetFieldName(category: string): string {
  return `categoryTarget-${category}`;
}

export function parseBudgetFormData(
  formData: FormData,
): BudgetValidationResult {
  const errors: Record<string, string> = {};
  const monthlyTarget = parseTargetField(
    formData,
    "monthlyTarget",
    "Monthly target",
    errors,
  );

  const categoryTargets = SUBSCRIPTION_CATEGORIES.map((category) => ({
    category,
    monthlyTarget: parseTargetField(
      formData,
      categoryTargetFieldName(category),
      `${category} target`,
      errors,
    ),
  }));

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: { monthlyTarget, categoryTargets },
  };
}

function parseTargetField(
  formData: FormData,
  key: string,
  label: string,
  errors: Record<string, string>,
): number | null {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    errors[key] = `${label} must be zero or greater.`;
    return null;
  }

  return parsed > 0 ? parsed : null;
}
