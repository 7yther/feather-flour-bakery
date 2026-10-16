import assert from "node:assert/strict";
import test from "node:test";
import { validateTeamRoleChange } from "../lib/team-roles.ts";

test("an owner can promote staff to owner", () => {
  assert.equal(validateTeamRoleChange({actorRole:"owner",currentRole:"staff",requestedRole:"owner",remainingActiveOwnerCount:1}),"owner");
});

test("an owner can move another owner to staff when an owner remains", () => {
  assert.equal(validateTeamRoleChange({actorRole:"owner",currentRole:"owner",requestedRole:"staff",remainingActiveOwnerCount:1}),"staff");
});

test("the final owner cannot be changed to staff", () => {
  assert.throws(
    () => validateTeamRoleChange({actorRole:"owner",currentRole:"owner",requestedRole:"staff",remainingActiveOwnerCount:0}),
    /At least one owner is required/,
  );
});

test("staff cannot change team roles", () => {
  assert.throws(
    () => validateTeamRoleChange({actorRole:"staff",currentRole:"staff",requestedRole:"owner",remainingActiveOwnerCount:1}),
    /Only an owner/,
  );
});

test("unknown roles are rejected", () => {
  assert.throws(
    () => validateTeamRoleChange({actorRole:"owner",currentRole:"staff",requestedRole:"admin",remainingActiveOwnerCount:1}),
    /valid team role/,
  );
});
