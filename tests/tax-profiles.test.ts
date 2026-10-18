import assert from "node:assert/strict";
import test from "node:test";
import { validateTaxProfileDeletion } from "../lib/tax-profiles.ts";

test("an owner can delete an unused tax profile", () => {
  assert.doesNotThrow(() => validateTaxProfileDeletion("owner", 0));
});

test("staff cannot delete tax profiles", () => {
  assert.throws(() => validateTaxProfileDeletion("staff", 0), /Only an owner/);
});

test("a tax profile used by a sale cannot be deleted", () => {
  assert.throws(() => validateTaxProfileDeletion("owner", 1), /used by recorded sales/);
});
