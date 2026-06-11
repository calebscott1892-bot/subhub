export const HOUSEHOLD_ROLES = ["Owner", "Adult", "Member", "Viewer"] as const;

export type HouseholdRole = (typeof HOUSEHOLD_ROLES)[number];

export const INVITABLE_ROLES = ["Adult", "Member", "Viewer"] as const;

export const HOUSEHOLD_ACTIONS = [
  "view",
  "add",
  "edit",
  "manage",
  "pay",
  "admin",
] as const;

export type HouseholdAction = (typeof HOUSEHOLD_ACTIONS)[number];

const ROLE_CAPABILITIES: Record<HouseholdRole, ReadonlySet<HouseholdAction>> = {
  Owner: new Set(["view", "add", "edit", "manage", "pay", "admin"]),
  Adult: new Set(["view", "add", "edit", "manage", "pay"]),
  Member: new Set(["view", "pay"]),
  Viewer: new Set(["view"]),
};

export function canPerform(
  role: HouseholdRole,
  action: HouseholdAction,
): boolean {
  return ROLE_CAPABILITIES[role].has(action);
}

export function assertCanPerform(
  role: HouseholdRole,
  action: HouseholdAction,
): void {
  if (!canPerform(role, action)) {
    throw new Error(`The ${role} role is not allowed to ${action}.`);
  }
}

export function isHouseholdRole(value: string): value is HouseholdRole {
  return (HOUSEHOLD_ROLES as readonly string[]).includes(value);
}
