import assert from "node:assert/strict";
import test from "node:test";
import { cleanPhone, earliestOrderTime, hasMinimumOrderNotice } from "../lib/order-validation.ts";

test("requires a full 48 hours of notice", () => {
  const now = new Date("2026-10-16T12:00:00.000Z");
  assert.equal(hasMinimumOrderNotice(new Date("2026-10-18T11:59:59.999Z"), now), false);
  assert.equal(hasMinimumOrderNotice(new Date("2026-10-18T12:00:00.000Z"), now), true);
  assert.equal(earliestOrderTime(now).toISOString(), "2026-10-18T12:00:00.000Z");
});

test("accepts common phone formatting and rejects short numbers", () => {
  assert.equal(cleanPhone("(251) 555-0199"), "(251) 555-0199");
  assert.equal(cleanPhone("555-0199"), "");
});
