import type { ParsedCsvRow } from "./parse-csv";
import type { SubscriptionFormInput } from "@/lib/subscriptions/validation";
import { parseSubscriptionFormData } from "@/lib/subscriptions/validation";

export type ImportRowValidation =
  | {
      ok: true;
      rowNumber: number;
      providerName: string;
      data: SubscriptionFormInput;
      errors?: never;
    }
  | {
      ok: false;
      rowNumber: number;
      providerName: string;
      data?: never;
      errors: string[];
    };

const fieldLabels: Record<string, string> = {
  providerName: "Provider name",
  category: "Category",
  status: "Status",
  billingCadence: "Billing cadence",
  intervalDays: "Custom interval days",
  priceAmount: "Price",
  currency: "Currency",
  startDate: "Start date",
  renewalDate: "Renewal date",
  trialStartDate: "Trial start date",
  trialEndDate: "Trial end date",
  cancelByDate: "Cancel-by date",
  postTrialPriceAmount: "Post-trial price",
  lastUsageDate: "Last usage date",
};

const columnAliases: Record<string, string> = {
  accountEmail: "accountEmailForProvider",
  accountEmailForProvider: "accountEmailForProvider",
  cancellationUrl: "cancelUrl",
  cancelUrl: "cancelUrl",
  billingUrl: "billingUrl",
  billingPortalUrl: "billingUrl",
};

const defaults: Record<string, string> = {
  category: "Other",
  status: "Active",
  billingCadence: "Monthly",
  currency: "USD",
};

export function validateImportRow(row: ParsedCsvRow): ImportRowValidation {
  const formData = new FormData();

  for (const [key, value] of Object.entries(defaults)) {
    formData.set(key, value);
  }

  for (const [key, value] of Object.entries(row.values)) {
    const normalizedKey = columnAliases[key] ?? key;
    formData.set(normalizedKey, value);
  }

  const parsed = parseSubscriptionFormData(formData);
  const providerName = String(row.values.providerName ?? "").trim();

  if (!parsed.ok) {
    return {
      ok: false,
      rowNumber: row.rowNumber,
      providerName,
      errors: Object.entries(parsed.errors).map(([field, error]) =>
        formatFieldError(field, error),
      ),
    };
  }

  return {
    ok: true,
    rowNumber: row.rowNumber,
    providerName: parsed.data.providerName,
    data: parsed.data,
  };
}

function formatFieldError(field: string, error: string): string {
  if (field === "providerName") {
    return error;
  }

  const label = fieldLabels[field] ?? field;
  return `${label}: ${error}`;
}
