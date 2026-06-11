import { describe, expect, test } from "vitest";
import { computeSplit } from "@/lib/sharing/split-rules";

describe("split rules", () => {
  test("splits equally across members with the owner as a participant", () => {
    const result = computeSplit(30, "Equal", [
      { memberId: "a" },
      { memberId: "b" },
    ]);

    expect(result).toEqual({
      ok: true,
      ownerAmount: 10,
      memberAmounts: [
        { memberId: "a", amount: 10 },
        { memberId: "b", amount: 10 },
      ],
    });
  });

  test("owner absorbs rounding remainder on equal splits", () => {
    const result = computeSplit(22.99, "Equal", [
      { memberId: "a" },
      { memberId: "b" },
    ]);

    expect(result).toEqual({
      ok: true,
      ownerAmount: 7.67,
      memberAmounts: [
        { memberId: "a", amount: 7.66 },
        { memberId: "b", amount: 7.66 },
      ],
    });
  });

  test("fixed split charges members their amount and the owner the remainder", () => {
    const result = computeSplit(50, "Fixed", [
      { memberId: "a", fixedAmount: 12.5 },
      { memberId: "b", fixedAmount: 20 },
    ]);

    expect(result).toEqual({
      ok: true,
      ownerAmount: 17.5,
      memberAmounts: [
        { memberId: "a", amount: 12.5 },
        { memberId: "b", amount: 20 },
      ],
    });
  });

  test("rejects fixed shares that exceed the total or are missing", () => {
    expect(
      computeSplit(20, "Fixed", [{ memberId: "a", fixedAmount: 25 }]),
    ).toMatchObject({ ok: false });
    expect(
      computeSplit(20, "Fixed", [{ memberId: "a", fixedAmount: null }]),
    ).toMatchObject({ ok: false });
  });

  test("percentage split charges members their share and the owner the rest", () => {
    const result = computeSplit(40, "Percentage", [
      { memberId: "a", percentage: 25 },
      { memberId: "b", percentage: 50 },
    ]);

    expect(result).toEqual({
      ok: true,
      ownerAmount: 10,
      memberAmounts: [
        { memberId: "a", amount: 10 },
        { memberId: "b", amount: 20 },
      ],
    });
  });

  test("rejects percentages outside 0-100 or summing past 100", () => {
    expect(
      computeSplit(40, "Percentage", [{ memberId: "a", percentage: 120 }]),
    ).toMatchObject({ ok: false });
    expect(
      computeSplit(40, "Percentage", [
        { memberId: "a", percentage: 60 },
        { memberId: "b", percentage: 60 },
      ]),
    ).toMatchObject({ ok: false });
    expect(
      computeSplit(40, "Percentage", [{ memberId: "a", percentage: null }]),
    ).toMatchObject({ ok: false });
  });

  test("with no included members the owner pays everything", () => {
    expect(computeSplit(35, "Equal", [])).toEqual({
      ok: true,
      ownerAmount: 35,
      memberAmounts: [],
    });
  });
});
