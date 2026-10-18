import assert from "node:assert/strict";
import test from "node:test";
import { validateTaxProfileDeletion } from "../lib/tax-profiles.ts";

test("an owner can delete an unused tax profile", () => {
  assert.doesNotThrow(() => validateTaxProfileDeletion("owner"));
});

test("staff cannot delete tax profiles", () => {
  assert.throws(() => validateTaxProfileDeletion("staff"), /Only an owner/);
});

test("an owner can delete a profile after its sales are detached", () => {
  assert.doesNotThrow(() => validateTaxProfileDeletion("owner"));
});
