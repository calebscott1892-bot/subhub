import { describe, expect, test } from "vitest";
import { parseCsv } from "@/lib/import/parse-csv";

describe("CSV parser", () => {
  test("maps headers to rows and preserves quoted commas", () => {
    const result = parseCsv(
      [
        "providerName,category,notes",
        '"Acme, Plus",Software,"Plan says ""family"", due soon"',
        "",
        "Spotify,Music,Shared playlist",
      ].join("\n"),
    );

    expect(result.errors).toEqual([]);
    expect(result.headers).toEqual(["providerName", "category", "notes"]);
    expect(result.rows).toEqual([
      {
        rowNumber: 2,
        values: {
          providerName: "Acme, Plus",
          category: "Software",
          notes: 'Plan says "family", due soon',
        },
      },
      {
        rowNumber: 4,
        values: {
          providerName: "Spotify",
          category: "Music",
          notes: "Shared playlist",
        },
      },
    ]);
  });

  test("reports row length mismatches without dropping the row", () => {
    const result = parseCsv("providerName,priceAmount\nNetflix,22.99,extra");

    expect(result.errors).toEqual([
      "Row 2 has 3 cells but the header has 2 columns.",
    ]);
    expect(result.rows[0].values).toEqual({
      providerName: "Netflix",
      priceAmount: "22.99",
    });
  });
});
