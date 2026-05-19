export const csvTemplateHeaders = [
  "providerName",
  "category",
  "status",
  "billingCadence",
  "priceAmount",
  "currency",
  "renewalDate",
  "trialEndDate",
  "cancelByDate",
  "cancelUrl",
  "billingUrl",
  "accountEmail",
  "notes",
];

export const csvTemplateExample = [
  "Netflix",
  "Streaming",
  "Active",
  "Monthly",
  "22.99",
  "USD",
  "2026-06-15",
  "",
  "",
  "https://www.netflix.com/cancelplan",
  "https://www.netflix.com/youraccount",
  "home@example.com",
  "Family plan",
];

export const subscriptionHubCsvTemplate = [
  csvTemplateHeaders.join(","),
  csvTemplateExample.map(escapeCsvCell).join(","),
].join("\n");

function escapeCsvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}
