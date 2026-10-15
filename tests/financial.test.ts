import assert from "node:assert/strict";
import test from "node:test";
import { activeRatesOn, calculateSaleTotals, inventoryReversal, recipeUnitCost, suggestedPrice } from "../lib/financial.ts";

test("tax-exclusive sale uses cents, prorates discounts, and keeps components separate", () => {
  const result = calculateSaleTotals(
    [{ unitPriceCents: 400, quantity: 5, taxable: true }, { unitPriceCents: 500, quantity: 1, taxable: false }],
    250,
    [{ name: "State", kind: "state", rateBps: 400 }, { name: "Local", kind: "city", rateBps: 600 }],
  );
  assert.deepEqual({ subtotal: result.subtotalCents, taxable: result.taxableCents, tax: result.taxCents, total: result.totalCents }, { subtotal: 2500, taxable: 1800, tax: 180, total: 2430 });
  assert.deepEqual(result.componentTaxes.map((x) => x.taxCents), [72, 108]);
});

test("tax-inclusive pricing extracts tax without adding it twice", () => {
  const result = calculateSaleTotals([{ unitPriceCents: 1100, quantity: 1, taxable: true }], 0, [{ name: "Combined", kind: "custom", rateBps: 1000 }], true);
  assert.equal(result.taxCents, 100); assert.equal(result.totalCents, 1100);
});

test("historical effective dates select the rate that was valid on the sale date", () => {
  const rates = [
    { rateBps: 400, effectiveFrom: "2025-01-01", effectiveTo: "2025-12-31", active: true },
    { rateBps: 500, effectiveFrom: "2026-01-01", effectiveTo: null, active: true },
  ];
  assert.equal(activeRatesOn(rates, "2025-06-01")[0].rateBps, 400);
  assert.equal(activeRatesOn(rates, "2026-06-01")[0].rateBps, 500);
});

test("recipe costing divides the entire batch and rounds suggested price to a quarter", () => {
  const cost = recipeUnitCost([220, 180, 100], 600, 120, 80, 24);
  assert.deepEqual(cost, { batchCostCents: 1300, unitCostCents: 54 });
  assert.equal(suggestedPrice(cost.unitCostCents, 6500), 175);
});

test("inventory is restored exactly once after refund or void", () => {
  assert.deepEqual(inventoryReversal("completed", [{ productId: "cookie", quantity: 5 }]), [{ productId: "cookie", quantityChange: 5 }]);
  assert.throws(() => inventoryReversal("refunded", [{ productId: "cookie", quantity: 5 }]), /already been reversed/);
  assert.throws(() => inventoryReversal("voided", [{ productId: "cookie", quantity: 5 }]), /already been reversed/);
});
