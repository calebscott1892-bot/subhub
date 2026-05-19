import { describe, expect, test } from "vitest";
import { validateImportRow } from "@/lib/import/validate-import-row";

describe("CSV import row validation", () => {
  test("normalizes a valid row into subscription input", () => {
    const result = validateImportRow({
      rowNumber: 2,
      values: {
        providerName: "  Canva Pro  ",
        category: "Software",
        status: "Trial",
        billingCadence: "Monthly",
        priceAmount: "0",
        currency: " usd ",
        trialEndDate: "2026-06-01",
        cancelUrl: " https://www.canva.com/settings/billing ",
        notes: " Imported from card statement ",
      },
    });

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      providerName: "Canva Pro",
      category: "Software",
      status: "Trial",
      billingCadence: "Monthly",
      priceAmount: 0,
      currency: "USD",
      trialEndDate: "2026-06-01",
      cancelByDate: "2026-06-01",
      cancelUrl: "https://www.canva.com/settings/billing",
      notes: "Imported from card statement",
    });
  });

  test("rejects missing provider names and malformed dates", () => {
    const result = validateImportRow({
      rowNumber: 5,
      values: {
        providerName: " ",
        category: "Software",
        status: "Active",
        billingCadence: "Monthly",
        priceAmount: "9.99",
        currency: "USD",
        renewalDate: "next month",
      },
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      "Provider name is required.",
      "Renewal date: Use YYYY-MM-DD format.",
    ]);
  });

  test("defaults missing optional fields to sensible values", () => {
    const result = validateImportRow({
      rowNumber: 3,
      values: {
        providerName: "iCloud",
        priceAmount: "2.99",
      },
    });

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      providerName: "iCloud",
      category: "Other",
      status: "Active",
      billingCadence: "Monthly",
      priceAmount: 2.99,
      currency: "USD",
    });
  });
});
