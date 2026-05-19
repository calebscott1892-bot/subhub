export type SubscriptionCategory =
  | "Streaming"
  | "Music"
  | "Software"
  | "Storage"
  | "Utilities"
  | "Finance"
  | "Health"
  | "News"
  | "Gaming"
  | "Membership"
  | "Other";

export type SubscriptionStatus =
  | "Active"
  | "Trial"
  | "Paused"
  | "Canceled"
  | "Expired";

export type BillingCadence = "Monthly" | "Yearly" | "Weekly" | "Custom";

export type Subscription = {
  id: string;
  providerName: string;
  category: SubscriptionCategory;
  status: SubscriptionStatus;
  billingCadence: BillingCadence;
  intervalDays?: number | null;
  priceAmount: number;
  currency: string;
  startDate?: string | null;
  renewalDate: string | null;
  trialStartDate?: string | null;
  trialEndDate?: string | null;
  cancelByDate?: string | null;
  postTrialPriceAmount?: number | null;
  accountEmailForProvider?: string | null;
  loginUrl?: string | null;
  billingUrl?: string | null;
  cancelUrl?: string | null;
  supportUrl?: string | null;
  paymentMethodLabel?: string | null;
  notes?: string | null;
  lastUsageDate?: string | null;
  createdAt: string;
  updatedAt: string;
};
