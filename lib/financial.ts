export type SaleLine = { unitPriceCents: number; quantity: number; taxable: boolean };
export type TaxRate = { name: string; kind: string; rateBps: number };

export function calculateSaleTotals(lines: SaleLine[], discountCents: number, rates: TaxRate[], taxInclusive = false, taxExempt = false) {
  const subtotalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  const discount = Math.min(Math.max(0, Math.round(discountCents)), subtotalCents);
  const netSubtotalCents = subtotalCents - discount;
  const taxableGross = lines.filter((line) => line.taxable).reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  const taxableCents = taxExempt || !subtotalCents ? 0 : Math.round(taxableGross * netSubtotalCents / subtotalCents);
  const totalRateBps = taxExempt ? 0 : rates.reduce((sum, rate) => sum + rate.rateBps, 0);
  const totalTaxCents = taxInclusive && totalRateBps
    ? Math.round(taxableCents * totalRateBps / (10_000 + totalRateBps))
    : rates.reduce((sum, rate) => sum + Math.round(taxableCents * rate.rateBps / 10_000), 0);
  const componentTaxes = rates.map((rate, index) => ({
    ...rate,
    taxCents: taxExempt ? 0 : taxInclusive && totalRateBps
      ? (index === rates.length - 1 ? totalTaxCents : Math.round(totalTaxCents * rate.rateBps / totalRateBps))
      : Math.round(taxableCents * rate.rateBps / 10_000),
  }));
  if (taxInclusive && componentTaxes.length > 1) {
    componentTaxes[componentTaxes.length - 1].taxCents = totalTaxCents - componentTaxes.slice(0, -1).reduce((sum, row) => sum + row.taxCents, 0);
  }
  return { subtotalCents, discountCents: discount, netSubtotalCents, taxableCents, taxCents: totalTaxCents, totalCents: taxInclusive ? netSubtotalCents : netSubtotalCents + totalTaxCents, componentTaxes };
}

export function recipeUnitCost(ingredientsCents: number[], laborCents: number, overheadCents: number, packagingCents: number, batchYield: number) {
  if (!Number.isInteger(batchYield) || batchYield <= 0) throw new Error("Batch yield must be a positive whole number.");
  const batchCostCents = [...ingredientsCents, laborCents, overheadCents, packagingCents].reduce((sum, value) => sum + Math.max(0, Math.round(value)), 0);
  return { batchCostCents, unitCostCents: Math.round(batchCostCents / batchYield) };
}

export function suggestedPrice(unitCostCents: number, targetMarginBps: number) {
  if (targetMarginBps <= 0 || targetMarginBps >= 10_000) throw new Error("Target margin must be between 0% and 100%.");
  return Math.ceil((unitCostCents / (1 - targetMarginBps / 10_000)) / 25) * 25;
}

export function inventoryReversal(currentStatus: string, lines: { productId: string; quantity: number }[]) {
  if (currentStatus !== "completed") throw new Error("This sale has already been reversed.");
  return lines.map((line) => ({ productId: line.productId, quantityChange: line.quantity }));
}

export function activeRatesOn<T extends { effectiveFrom: string; effectiveTo?: string | null; active: boolean }>(rates: T[], date: string) {
  return rates.filter((rate) => rate.active && rate.effectiveFrom <= date && (!rate.effectiveTo || rate.effectiveTo >= date));
}
