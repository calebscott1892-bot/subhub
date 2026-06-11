import { describe, expect, test } from "vitest";
import type { HouseholdMember } from "@/lib/household/repository";
import { parseSharingFormData, shareFieldName } from "@/lib/sharing/validation";

const members: HouseholdMember[] = [
  { id: "m1", name: "Jordan", email: null, role: "Adult", status: "Active" },
  { id: "m2", name: "Sam", email: null, role: "Member", status: "Active" },
];

describe("sharing form validation", () => {
  test("split type None clears sharing", () => {
    const formData = new FormData();
    formData.set("splitType", "None");

    expect(parseSharingFormData(formData, members)).toEqual({
      ok: true,
      data: { splitType: null, shares: [] },
    });
  });

  test("equal split includes checked members only", () => {
    const formData = new FormData();
    formData.set("splitType", "Equal");
    formData.set(shareFieldName("include", "m2"), "on");

    expect(parseSharingFormData(formData, members)).toEqual({
      ok: true,
      data: { splitType: "Equal", shares: [{ memberId: "m2" }] },
    });
  });

  test("fixed split reads member amounts and flags invalid ones", () => {
    const formData = new FormData();
    formData.set("splitType", "Fixed");
    formData.set(shareFieldName("amount", "m1"), "12.50");
    formData.set(shareFieldName("amount", "m2"), "-3");

    const result = parseSharingFormData(formData, members);

    expect(result.ok).toBe(false);
    expect(result.errors?.[shareFieldName("amount", "m2")]).toMatch(/Sam/);
  });

  test("percentage split caps shares at 100", () => {
    const formData = new FormData();
    formData.set("splitType", "Percentage");
    formData.set(shareFieldName("percentage", "m1"), "140");

    const result = parseSharingFormData(formData, members);

    expect(result.ok).toBe(false);
    expect(result.errors?.[shareFieldName("percentage", "m1")]).toMatch(/100/);
  });

  test("a split with nobody included falls back to not shared", () => {
    const formData = new FormData();
    formData.set("splitType", "Equal");

    expect(parseSharingFormData(formData, members)).toEqual({
      ok: true,
      data: { splitType: null, shares: [] },
    });
  });
});
