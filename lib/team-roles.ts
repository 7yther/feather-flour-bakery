export type TeamRole = "owner" | "staff";

export function validateTeamRoleChange({
  actorRole,
  currentRole,
  requestedRole,
  remainingActiveOwnerCount,
}: {
  actorRole: TeamRole;
  currentRole: TeamRole;
  requestedRole: unknown;
  remainingActiveOwnerCount: number;
}): TeamRole {
  if (actorRole !== "owner") throw new Error("Only an owner can change team roles.");
  if (requestedRole !== "owner" && requestedRole !== "staff") throw new Error("Choose a valid team role.");
  if (currentRole === "owner" && requestedRole === "staff" && remainingActiveOwnerCount < 1) {
    throw new Error("At least one owner is required. Promote another staff member before changing this role.");
  }
  return requestedRole;
}
