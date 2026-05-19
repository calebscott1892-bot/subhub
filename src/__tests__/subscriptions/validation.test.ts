import { describe, expect, test } from "vitest";
import { parseSubscriptionFormData } from "@/lib/subscriptions/validation";

describe("subscription form validation", () => {
  test("normalizes valid subscription form data", () => {
    const result = parseSubscriptionFormData(
      makeFormData({
        providerName: "  Acme Streaming  ",
        category: "Streaming",
        status: "Active",
        billingCadence: "Monthly",
        priceAmount: "19.99",
        currency: " usd ",
        renewalDate: "2026-06-19",
        accountEmailForProvider: " billing@example.com ",
        billingUrl: " https://example.com/billing ",
        cancelUrl: "",
        notes: "  Shared account  ",
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      providerName: "Acme Streaming",
      category: "Streaming",
      status: "Active",
      billingCadence: "Monthly",
      priceAmount: 19.99,
      currency: "USD",
      renewalDate: "2026-06-19",
      accountEmailForProvider: "billing@example.com",
      billingUrl: "https://example.com/billing",
      cancelUrl: null,
      notes: "Shared account",
    });
  });

  test("defaults cancel-by date from trial end date", () => {
    const result = parseSubscriptionFormData(
      makeFormData({
        providerName: "Design Trial",
        category: "Software",
        status: "Trial",
        billingCadence: "Monthly",
        priceAmount: "0",
        currency: "USD",
        trialEndDate: "2026-05-29",
        cancelByDate: "",
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.data?.cancelByDate).toBe("2026-05-29");
  });

  test("rejects blank provider names and invalid prices", () => {
    const result = parseSubscriptionFormData(
      makeFormData({
        providerName: " ",
        category: "Software",
        status: "Active",
        billingCadence: "Monthly",
        priceAmount: "-1",
        currency: "USD",
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual({
      providerName: "Provider name is required.",
      priceAmount: "Price must be zero or greater.",
    });
  });

  test("rejects unsupported enum values and malformed dates", () => {
    const result = parseSubscriptionFormData(
      makeFormData({
        providerName: "Unknown",
        category: "Food",
        status: "Live",
        billingCadence: "Biweekly",
        priceAmount: "8",
        currency: "US",
        renewalDate: "June 1",
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual({
      category: "Choose a supported category.",
      status: "Choose a supported status.",
      billingCadence: "Choose a supported billing cadence.",
      currency: "Currency must be a 3-letter code.",
      renewalDate: "Use YYYY-MM-DD format.",
    });
  });
});

function makeFormData(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}
