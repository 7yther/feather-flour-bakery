import assert from "node:assert/strict";
import test from "node:test";
import { orderSmsBody, smsKindForOrderStatus, toE164 } from "../lib/sms.ts";

test("normalizes common US phone numbers for SMS", () => {
  assert.equal(toE164("(251) 377-9016"), "+12513779016");
  assert.equal(toE164("1-251-377-9016"), "+12513779016");
  assert.equal(toE164("555-0199"), "");
});

test("maps order workflow statuses to customer SMS updates", () => {
  assert.equal(smsKindForOrderStatus("new"), "received");
  assert.equal(smsKindForOrderStatus("confirmed"), "approved");
  assert.equal(smsKindForOrderStatus("ready"), "ready");
  assert.equal(smsKindForOrderStatus("fulfilled"), "completed");
});

test("initial order text identifies the bakery and includes opt out", () => {
  const body = orderSmsBody("received", {
    orderNumber: "FF-20261016-ABC123",
    customerName: "Ravyn Warren",
    customerPhone: "(251) 377-9016",
    requestedAt: "2026-10-20T18:00:00.000Z",
  });
  assert.match(body, /^Feather & Flour:/);
  assert.match(body, /FF-20261016-ABC123/);
  assert.match(body, /Reply STOP to unsubscribe\.$/);
});
