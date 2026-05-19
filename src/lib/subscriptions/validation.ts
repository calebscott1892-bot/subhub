import type {
  BillingCadence,
  SubscriptionCategory,
  SubscriptionStatus,
} from "./types";

export type SubscriptionFormInput = {
  providerName: string;
  category: SubscriptionCategory;
  status: SubscriptionStatus;
  billingCadence: BillingCadence;
  intervalDays: number | null;
  priceAmount: number;
  currency: string;
  startDate: string | null;
  renewalDate: string | null;
  trialStartDate: string | null;
  trialEndDate: string | null;
  cancelByDate: string | null;
  postTrialPriceAmount: number | null;
  accountEmailForProvider: string | null;
  loginUrl: string | null;
  billingUrl: string | null;
  cancelUrl: string | null;
  supportUrl: string | null;
  paymentMethodLabel: string | null;
  notes: string | null;
  lastUsageDate: string | null;
};

export type SubscriptionValidationResult =
  | { ok: true; data: SubscriptionFormInput; errors?: never }
  | { ok: false; data?: never; errors: Record<string, string> };

const categories = new Set<SubscriptionCategory>([
  "Streaming",
  "Music",
  "Software",
  "Storage",
  "Utilities",
  "Finance",
  "Health",
  "News",
  "Gaming",
  "Membership",
  "Other",
]);

const statuses = new Set<SubscriptionStatus>([
  "Active",
  "Trial",
  "Paused",
  "Canceled",
  "Expired",
]);

const cadences = new Set<BillingCadence>([
  "Monthly",
  "Yearly",
  "Weekly",
  "Custom",
]);

export function parseSubscriptionFormData(
  formData: FormData,
): SubscriptionValidationResult {
  const errors: Record<string, string> = {};
  const providerName = requiredText(formData, "providerName");
  const category = requiredText(formData, "category");
  const status = requiredText(formData, "status");
  const billingCadence = requiredText(formData, "billingCadence");
  const priceAmount = parseRequiredAmount(formData, "priceAmount");
  const intervalDays = parseOptionalPositiveInteger(formData, "intervalDays");
  const currency = requiredText(formData, "currency").toUpperCase() || "USD";
  const trialEndDate = parseOptionalDate(formData, "trialEndDate");
  const explicitCancelByDate = parseOptionalDate(formData, "cancelByDate");

  if (!providerName) {
    errors.providerName = "Provider name is required.";
  }

  if (!categories.has(category as SubscriptionCategory)) {
    errors.category = "Choose a supported category.";
  }

  if (!statuses.has(status as SubscriptionStatus)) {
    errors.status = "Choose a supported status.";
  }

  if (!cadences.has(billingCadence as BillingCadence)) {
    errors.billingCadence = "Choose a supported billing cadence.";
  }

  if (priceAmount === null || priceAmount < 0) {
    errors.priceAmount = "Price must be zero or greater.";
  }

  if (intervalDays !== null && intervalDays <= 0) {
    errors.intervalDays = "Interval must be greater than zero.";
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    errors.currency = "Currency must be a 3-letter code.";
  }

  addDateError(errors, formData, "startDate");
  addDateError(errors, formData, "renewalDate");
  addDateError(errors, formData, "trialStartDate");
  addDateError(errors, formData, "trialEndDate");
  addDateError(errors, formData, "cancelByDate");
  addDateError(errors, formData, "lastUsageDate");

  const postTrialPriceAmount = parseOptionalAmount(
    formData,
    "postTrialPriceAmount",
  );

  if (postTrialPriceAmount !== null && postTrialPriceAmount < 0) {
    errors.postTrialPriceAmount = "Post-trial price must be zero or greater.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      providerName,
      category: category as SubscriptionCategory,
      status: status as SubscriptionStatus,
      billingCadence: billingCadence as BillingCadence,
      intervalDays,
      priceAmount: priceAmount ?? 0,
      currency,
      startDate: parseOptionalDate(formData, "startDate"),
      renewalDate: parseOptionalDate(formData, "renewalDate"),
      trialStartDate: parseOptionalDate(formData, "trialStartDate"),
      trialEndDate,
      cancelByDate: explicitCancelByDate || trialEndDate,
      postTrialPriceAmount,
      accountEmailForProvider: optionalText(formData, "accountEmailForProvider"),
      loginUrl: optionalText(formData, "loginUrl"),
      billingUrl: optionalText(formData, "billingUrl"),
      cancelUrl: optionalText(formData, "cancelUrl"),
      supportUrl: optionalText(formData, "supportUrl"),
      paymentMethodLabel: optionalText(formData, "paymentMethodLabel"),
      notes: optionalText(formData, "notes"),
      lastUsageDate: parseOptionalDate(formData, "lastUsageDate"),
    },
  };
}

function requiredText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string): string | null {
  const value = requiredText(formData, key);
  return value || null;
}

function parseRequiredAmount(formData: FormData, key: string): number | null {
  const value = requiredText(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalAmount(formData: FormData, key: string): number | null {
  const value = requiredText(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalPositiveInteger(
  formData: FormData,
  key: string,
): number | null {
  const value = requiredText(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : -1;
}

function parseOptionalDate(formData: FormData, key: string): string | null {
  const value = requiredText(formData, key);

  if (!value) {
    return null;
  }

  return isDateOnly(value) ? value : null;
}

function addDateError(
  errors: Record<string, string>,
  formData: FormData,
  key: string,
) {
  const value = requiredText(formData, key);

  if (value && !isDateOnly(value)) {
    errors[key] = "Use YYYY-MM-DD format.";
  }
}

function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
