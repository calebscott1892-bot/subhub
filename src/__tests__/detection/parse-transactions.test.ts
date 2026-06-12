import { describe, expect, test } from "vitest";
import {
  normalizeTransactionDate,
  parseTransactionsCsv,
} from "@/lib/detection/parse-transactions";

describe("transaction CSV parsing", () => {
  test("parses flexible headers and negative amounts", () => {
    const result = parseTransactionsCsv(
      [
        "Date,Details,Debit",
        "2026-05-01,NETFLIX.COM,-22.99",
        '02/05/2026,"SPOTIFY, FAMILY",-19.99',
      ].join("\n"),
    );

    expect(result.errors).toEqual([]);
    expect(result.transactions).toEqual([
      { date: "2026-05-01", description: "NETFLIX.COM", amount: 22.99 },
      { date: "2026-05-02", description: "SPOTIFY, FAMILY", amount: 19.99 },
    ]);
  });

  test("reports unusable rows without dropping the rest", () => {
    const result = parseTransactionsCsv(
      [
        "date,description,amount",
        "not-a-date,NETFLIX,-22.99",
        "2026-05-01,,-10",
        "2026-05-02,VALID ROW,-5.00",
        "2026-05-03,ZERO ROW,0",
      ].join("\n"),
    );

    expect(result.transactions).toEqual([
      { date: "2026-05-02", description: "VALID ROW", amount: 5 },
    ]);
    expect(result.errors).toHaveLength(3);
  });

  test("fails clearly when required columns are missing", () => {
    const result = parseTransactionsCsv("foo,bar\n1,2");

    expect(result.transactions).toEqual([]);
    expect(result.errors[0]).toMatch(/date, description, and amount/);
  });

  test("handles day-first and month-first slash dates", () => {
    expect(normalizeTransactionDate("28/05/2026")).toBe("2026-05-28");
    expect(normalizeTransactionDate("05/28/2026")).toBe("2026-05-28");
    expect(normalizeTransactionDate("2026-5-3")).toBe("2026-05-03");
    expect(normalizeTransactionDate("31/02/2026")).toBeNull();
  });
});
