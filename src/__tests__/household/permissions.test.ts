import { describe, expect, test } from "vitest";
import {
  assertCanPerform,
  canPerform,
  HOUSEHOLD_ACTIONS,
  isHouseholdRole,
} from "@/lib/household/permissions";

describe("household permissions", () => {
  test("owner can perform every action including admin", () => {
    for (const action of HOUSEHOLD_ACTIONS) {
      expect(canPerform("Owner", action)).toBe(true);
    }
  });

  test("adults manage subscriptions but never household admin", () => {
    expect(canPerform("Adult", "view")).toBe(true);
    expect(canPerform("Adult", "add")).toBe(true);
    expect(canPerform("Adult", "edit")).toBe(true);
    expect(canPerform("Adult", "manage")).toBe(true);
    expect(canPerform("Adult", "pay")).toBe(true);
    expect(canPerform("Adult", "admin")).toBe(false);
  });

  test("members can view and pay only", () => {
    expect(canPerform("Member", "view")).toBe(true);
    expect(canPerform("Member", "pay")).toBe(true);
    expect(canPerform("Member", "add")).toBe(false);
    expect(canPerform("Member", "edit")).toBe(false);
    expect(canPerform("Member", "manage")).toBe(false);
    expect(canPerform("Member", "admin")).toBe(false);
  });

  test("viewers can only view", () => {
    expect(canPerform("Viewer", "view")).toBe(true);
    expect(canPerform("Viewer", "pay")).toBe(false);
  });

  test("assertCanPerform throws for disallowed actions", () => {
    expect(() => assertCanPerform("Viewer", "admin")).toThrowError(
      /not allowed/,
    );
    expect(() => assertCanPerform("Owner", "admin")).not.toThrow();
  });

  test("recognizes valid household roles", () => {
    expect(isHouseholdRole("Adult")).toBe(true);
    expect(isHouseholdRole("Stranger")).toBe(false);
  });
});
