import { describe, expect, test } from "vitest";
import {
  detectRecurringCharges,
  normalizeMerchant,
} from "@/lib/detection/recurring";
import type { BankTransaction } from "@/lib/detection/parse-transactions";
import type { Subscription } from "@/lib/subscriptions/types";

describe("recurring charge detection", () => {
  test("detects a monthly subscription with cadence, price, and next charge", () => {
    const candidates = detectRecurringCharges([
      charge("2026-03-09", "DISNEY PLUS SYDNEY", 13.99),
      charge("2026-04-09", "DISNEY PLUS SYDNEY", 13.99),
      charge("2026-05-09", "DISNEY PLUS SYDNEY", 13.99),
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      billingCadence: "Monthly",
      lastAmount: 13.99,
      occurrenceCount: 3,
      nextEstimatedCharge: "2026-06-09",
      categoryGuess: "Streaming",
    });
    expect(candidates[0].confidence).toBeGreaterThan(0.8);
    expect(candidates[0].evidence).toHaveLength(3);
  });

  test("detects weekly and yearly cadences", () => {
    const candidates = detectRecurringCharges([
      charge("2026-05-05", "ANYTIME FITNESS", 14.5),
      charge("2026-05-12", "ANYTIME FITNESS", 14.5),
      charge("2026-05-19", "ANYTIME FITNESS", 14.5),
      charge("2025-06-01", "ADOBE CREATIVE CLOUD", 659.88),
      charge("2026-06-01", "ADOBE CREATIVE CLOUD", 659.88),
    ]);

    const byMerchant = Object.fromEntries(
      candidates.map((candidate) => [candidate.normalizedMerchant, candidate]),
    );

    expect(byMerchant["anytime fitness"].billingCadence).toBe("Weekly");
    expect(byMerchant["adobe creative cloud"].billingCadence).toBe("Yearly");
  });

  test("tolerates a price change but keeps the latest amount", () => {
    const candidates = detectRecurringCharges([
      charge("2026-03-06", "AUDIBLE AU MEMBERSHIP", 14.95),
      charge("2026-04-06", "AUDIBLE AU MEMBERSHIP", 16.45),
      charge("2026-05-06", "AUDIBLE AU MEMBERSHIP", 16.45),
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].lastAmount).toBe(16.45);
  });

  test("ignores irregular spending and single charges", () => {
    const candidates = detectRecurringCharges([
      charge("2026-05-01", "AMAZON MKTP AU 123", 58.12),
      charge("2026-05-09", "AMAZON MKTP AU 987", 12.4),
      charge("2026-05-12", "AMAZON MKTP AU 555", 149.0),
      charge("2026-05-13", "CITY PARKING", 4.5),
    ]);

    expect(candidates).toHaveLength(0);
  });

  test("links candidates to existing subscriptions to prevent duplicates", () => {
    const existing: Subscription[] = [
      {
        id: "netflix-premium",
        providerName: "Netflix Premium",
        category: "Streaming",
        status: "Active",
        billingCadence: "Monthly",
        priceAmount: 22.99,
        currency: "USD",
        renewalDate: "2026-05-28",
        createdAt: "2026-05-19T00:00:00.000Z",
        updatedAt: "2026-05-19T00:00:00.000Z",
      },
    ];

    const candidates = detectRecurringCharges(
      [
        charge("2026-03-28", "NETFLIX.COM 866-579", 22.99),
        charge("2026-04-28", "NETFLIX.COM 866-579", 22.99),
        charge("2026-05-28", "NETFLIX.COM 866-579", 22.99),
      ],
      existing,
    );

    expect(candidates[0].matchedSubscriptionId).toBe("netflix-premium");
  });

  test("normalizes processor prefixes and reference numbers", () => {
    expect(normalizeMerchant("SQ *BLUE BOTTLE 0042")).toBe("blue bottle");
    expect(normalizeMerchant("PAYPAL *SPOTIFY 12345")).toBe("spotify");
    expect(normalizeMerchant("NETFLIX.COM 866-579-7172")).toBe("netflix com");
  });
});

function charge(
  date: string,
  description: string,
  amount: number,
): BankTransaction {
  return { date, description, amount };
}
