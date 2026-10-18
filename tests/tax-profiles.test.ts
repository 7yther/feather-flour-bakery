import assert from "node:assert/strict";
import test from "node:test";
import { activeTaxComponents, validateTaxProfileDeletion } from "../lib/tax-profiles.ts";

test("an owner can delete an unused tax profile", () => {
  assert.doesNotThrow(() => validateTaxProfileDeletion("owner"));
});

test("staff cannot delete tax profiles", () => {
  assert.throws(() => validateTaxProfileDeletion("staff"), /Only an owner/);
});

test("an owner can delete a profile after its sales are detached", () => {
  assert.doesNotThrow(() => validateTaxProfileDeletion("owner"));
});

test("only the current active tax components are shown for a profile", () => {
  const components = [
    { id: "old-state", profileId: "mobile", active: false },
    { id: "current-state", profileId: "mobile", active: true },
    { id: "other-county", profileId: "other", active: true },
  ];
  assert.deepEqual(activeTaxComponents(components, "mobile").map((component) => component.id), ["current-state"]);
});
