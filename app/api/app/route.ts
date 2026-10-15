import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import * as s from "@/db/schema";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { calculateSaleTotals, inventoryReversal, recipeUnitCost } from "@/lib/financial";

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const cents = (value: unknown) => Math.max(0, Math.round(Number(value) || 0));
const whole = (value: unknown) => Math.max(0, Math.floor(Number(value) || 0));
const text = (value: unknown, max = 500) => String(value ?? "").trim().slice(0, max);

async function auth() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const db = getDb();
  const stamp = now();
  await db.insert(s.users).values({ id: user.userId, email: user.email, displayName: user.displayName, createdAt: stamp, updatedAt: stamp })
    .onConflictDoUpdate({ target: s.users.id, set: { email: user.email, displayName: user.displayName, updatedAt: stamp } });
  await db.insert(s.settings).values({ userId: user.userId, contactEmail: user.email, updatedAt: stamp }).onConflictDoNothing();
  return { user, db };
}

async function bootstrap(userId: string) {
  const db = getDb();
  const stamp = now();
  const [productCount, expenseCount] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(s.productCategories).where(eq(s.productCategories.userId, userId)),
    db.select({ n: sql<number>`count(*)` }).from(s.expenseCategories).where(eq(s.expenseCategories.userId, userId)),
  ]);
  const queries: any[] = [];
  if (!Number(productCount[0]?.n)) {
    for (const name of ["Cookies", "Brownies & Bars", "Cupcakes & Cakes", "Gift Boxes", "Other"]) {
      queries.push(db.insert(s.productCategories).values({ id: id(), userId, name, createdAt: stamp, updatedAt: stamp }));
    }
  }
  if (!Number(expenseCount[0]?.n)) {
    for (const name of ["Ingredients", "Packaging and labels", "Baking equipment", "Vendor booth fees", "Business licenses and permits", "Advertising", "Transportation", "Payment processing fees", "Utilities", "Other business expenses"]) {
      queries.push(db.insert(s.expenseCategories).values({ id: id(), userId, name, createdAt: stamp, updatedAt: stamp }));
    }
  }
  if (queries.length) await (db as any).batch(queries);
}

export async function GET() {
  const ctx = await auth();
  if (!ctx) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { db, user } = ctx;
  await bootstrap(user.userId);
  const uid = user.userId;
  const [appSettings, categories, products, ingredients, recipes, recipeIngredients, taxProfiles, allTaxComponents, sales, allSaleItems, allTaxes, inventory, expenseCategories, expenses, events, eventInventory, audits] = await Promise.all([
    db.select().from(s.settings).where(eq(s.settings.userId, uid)).limit(1),
    db.select().from(s.productCategories).where(eq(s.productCategories.userId, uid)).orderBy(asc(s.productCategories.name)),
    db.select().from(s.products).where(eq(s.products.userId, uid)).orderBy(desc(s.products.active), asc(s.products.name)),
    db.select().from(s.ingredients).where(eq(s.ingredients.userId, uid)).orderBy(asc(s.ingredients.name)),
    db.select().from(s.recipes).where(eq(s.recipes.userId, uid)).orderBy(asc(s.recipes.name)),
    db.select().from(s.recipeIngredients),
    db.select().from(s.taxProfiles).where(eq(s.taxProfiles.userId, uid)).orderBy(asc(s.taxProfiles.name)),
    db.select().from(s.taxComponents).orderBy(desc(s.taxComponents.effectiveFrom)),
    db.select().from(s.sales).where(eq(s.sales.userId, uid)).orderBy(desc(s.sales.soldAt)).limit(1000),
    db.select().from(s.saleItems),
    db.select().from(s.appliedSaleTaxes),
    db.select().from(s.inventoryTransactions).where(eq(s.inventoryTransactions.userId, uid)).orderBy(desc(s.inventoryTransactions.occurredAt)).limit(1000),
    db.select().from(s.expenseCategories).where(eq(s.expenseCategories.userId, uid)).orderBy(asc(s.expenseCategories.name)),
    db.select().from(s.expenses).where(eq(s.expenses.userId, uid)).orderBy(desc(s.expenses.expenseDate)).limit(1000),
    db.select().from(s.vendorEvents).where(eq(s.vendorEvents.userId, uid)).orderBy(desc(s.vendorEvents.eventDate)),
    db.select().from(s.eventInventory),
    db.select().from(s.auditLogs).where(eq(s.auditLogs.userId, uid)).orderBy(desc(s.auditLogs.createdAt)).limit(100),
  ]);
  const recipeIds = new Set(recipes.map((r) => r.id));
  const profileIds = new Set(taxProfiles.map((p) => p.id));
  const saleIds = new Set(sales.map((x) => x.id));
  const eventIds = new Set(events.map((x) => x.id));
  return Response.json({
    user, settings: appSettings[0], categories, products, ingredients, recipes,
    recipeIngredients: recipeIngredients.filter((x) => recipeIds.has(x.recipeId)), taxProfiles,
    taxComponents: allTaxComponents.filter((x) => profileIds.has(x.profileId)), sales,
    saleItems: allSaleItems.filter((x) => saleIds.has(x.saleId)), appliedTaxes: allTaxes.filter((x) => saleIds.has(x.saleId)),
    inventory, expenseCategories, expenses, events, eventInventory: eventInventory.filter((x) => eventIds.has(x.eventId)), audits,
  });
}

export async function POST(request: Request) {
  const ctx = await auth();
  if (!ctx) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { db, user } = ctx;
  const body = await request.json() as Record<string, any>;
  const stamp = now();
  try {
    switch (body.action) {
      case "saveCategory": {
        const name = text(body.name, 80); if (!name) throw new Error("Category name is required.");
        const rowId = body.id || id();
        if (body.id) await db.update(s.productCategories).set({ name, updatedAt: stamp }).where(and(eq(s.productCategories.id, rowId), eq(s.productCategories.userId, user.userId)));
        else await db.insert(s.productCategories).values({ id: rowId, userId: user.userId, name, createdAt: stamp, updatedAt: stamp });
        return ok();
      }
      case "saveProduct": {
        const name = text(body.name, 120); if (!name) throw new Error("Product name is required.");
        const rowId = body.id || id();
        const values = { categoryId: body.categoryId || null, name, description: text(body.description, 1000), sku: text(body.sku, 50) || `FF-${rowId.slice(0, 8).toUpperCase()}`, priceCents: cents(body.priceCents), costCents: cents(body.costCents), packagingCostCents: cents(body.packagingCostCents), lowStockThreshold: whole(body.lowStockThreshold), taxable: body.taxable !== false, active: body.active !== false, photoKey: body.photoKey || null, updatedAt: stamp };
        if (body.id) await db.update(s.products).set(values).where(and(eq(s.products.id, rowId), eq(s.products.userId, user.userId)));
        else await db.insert(s.products).values({ id: rowId, userId: user.userId, stockQty: whole(body.stockQty), createdAt: stamp, ...values });
        await log(db, user.userId, body.id ? "update" : "create", "product", rowId, { name }); return ok();
      }
      case "archiveProduct": {
        await db.update(s.products).set({ active: false, updatedAt: stamp }).where(and(eq(s.products.id, body.id), eq(s.products.userId, user.userId)));
        await log(db, user.userId, "archive", "product", body.id, {}); return ok();
      }
      case "adjustInventory": {
        const qty = Math.trunc(Number(body.quantityChange)); if (!qty) throw new Error("Enter a non-zero quantity.");
        const [product, prefs] = await Promise.all([
          db.select().from(s.products).where(and(eq(s.products.id, body.productId), eq(s.products.userId, user.userId))).limit(1),
          db.select().from(s.settings).where(eq(s.settings.userId, user.userId)).limit(1),
        ]);
        if (!product[0]) throw new Error("Product not found.");
        if (!prefs[0]?.allowNegativeInventory && product[0].stockQty + qty < 0) throw new Error("This adjustment would make inventory negative.");
        const txId = id();
        await (db as any).batch([
          db.update(s.products).set({ stockQty: sql`${s.products.stockQty} + ${qty}`, updatedAt: stamp }).where(eq(s.products.id, product[0].id)),
          db.insert(s.inventoryTransactions).values({ id: txId, userId: user.userId, productId: product[0].id, type: body.type || (qty > 0 ? "produced" : "adjustment"), quantityChange: qty, reason: text(body.reason, 240) || "Manual adjustment", occurredAt: stamp }),
          db.insert(s.auditLogs).values({ id: id(), userId: user.userId, action: "adjust", entityType: "inventory", entityId: product[0].id, details: JSON.stringify({ quantityChange: qty, reason: text(body.reason) }), createdAt: stamp }),
        ]); return ok();
      }
      case "saveIngredient": {
        const name = text(body.name, 120); if (!name) throw new Error("Ingredient name is required.");
        const quantityMicros = Math.round(Number(body.purchaseQuantity) * 1_000_000); if (quantityMicros <= 0) throw new Error("Package quantity must be greater than zero.");
        const rowId = body.id || id(); const values = { name, purchaseCostCents: cents(body.purchaseCostCents), purchaseQuantityMicros: quantityMicros, unit: text(body.unit, 30), vendor: text(body.vendor, 120), updatedAt: stamp };
        if (body.id) await db.update(s.ingredients).set(values).where(and(eq(s.ingredients.id, rowId), eq(s.ingredients.userId, user.userId)));
        else await db.insert(s.ingredients).values({ id: rowId, userId: user.userId, createdAt: stamp, ...values }); return ok();
      }
      case "saveRecipe": {
        const product = await db.select().from(s.products).where(and(eq(s.products.id, body.productId), eq(s.products.userId, user.userId))).limit(1);
        if (!product[0]) throw new Error("Choose a product.");
        const batchYield = whole(body.batchYield); if (!batchYield) throw new Error("Batch yield must be greater than zero.");
        const supplied = (body.ingredients || []).filter((x: any) => Number(x.quantity) > 0);
        const ids = supplied.map((x: any) => String(x.ingredientId));
        const ingredients = ids.length ? await db.select().from(s.ingredients).where(and(eq(s.ingredients.userId, user.userId), inArray(s.ingredients.id, ids))) : [];
        const map = new Map(ingredients.map((x) => [x.id, x]));
        let ingredientCost = 0;
        for (const item of supplied) { const ing = map.get(item.ingredientId); if (!ing) throw new Error("Recipe ingredient not found."); ingredientCost += Math.round(ing.purchaseCostCents * (Number(item.quantity) * 1_000_000) / ing.purchaseQuantityMicros); }
        const recipeId = body.id || id();
        const batchExtras = cents(body.laborCostCents) + cents(body.overheadCostCents) + cents(body.packagingCostCents);
        const unitCost = recipeUnitCost([ingredientCost], cents(body.laborCostCents), cents(body.overheadCostCents), cents(body.packagingCostCents), batchYield).unitCostCents;
        const queries: any[] = [];
        const recipeValues = { productId: product[0].id, name: text(body.name, 120) || `${product[0].name} recipe`, batchYield, laborCostCents: cents(body.laborCostCents), overheadCostCents: cents(body.overheadCostCents), packagingCostCents: cents(body.packagingCostCents), notes: text(body.notes, 1000), updatedAt: stamp };
        if (body.id) { queries.push(db.update(s.recipes).set(recipeValues).where(and(eq(s.recipes.id, recipeId), eq(s.recipes.userId, user.userId)))); queries.push(db.delete(s.recipeIngredients).where(eq(s.recipeIngredients.recipeId, recipeId))); }
        else queries.push(db.insert(s.recipes).values({ id: recipeId, userId: user.userId, createdAt: stamp, ...recipeValues }));
        for (const item of supplied) queries.push(db.insert(s.recipeIngredients).values({ id: id(), recipeId, ingredientId: item.ingredientId, quantityMicros: Math.round(Number(item.quantity) * 1_000_000) }));
        queries.push(db.update(s.products).set({ costCents: unitCost, updatedAt: stamp }).where(eq(s.products.id, product[0].id)));
        queries.push(db.insert(s.auditLogs).values({ id: id(), userId: user.userId, action: body.id ? "update" : "create", entityType: "recipe", entityId: recipeId, details: JSON.stringify({ unitCostCents: unitCost }), createdAt: stamp }));
        await (db as any).batch(queries); return Response.json({ ok: true, unitCostCents: unitCost });
      }
      case "saveTaxProfile": {
        const name = text(body.name, 120); if (!name) throw new Error("Tax profile name is required.");
        const profileId = body.id || id(); const profileValues = { name, location: text(body.location, 200), taxInclusive: !!body.taxInclusive, active: body.active !== false, updatedAt: stamp };
        const queries: any[] = [];
        if (body.id) { queries.push(db.update(s.taxProfiles).set(profileValues).where(and(eq(s.taxProfiles.id, profileId), eq(s.taxProfiles.userId, user.userId)))); queries.push(db.delete(s.taxComponents).where(eq(s.taxComponents.profileId, profileId))); }
        else queries.push(db.insert(s.taxProfiles).values({ id: profileId, userId: user.userId, createdAt: stamp, ...profileValues }));
        for (const c of (body.components || [])) {
          const rateBps = Math.max(0, Math.round(Number(c.ratePercent) * 100));
          if (text(c.name)) queries.push(db.insert(s.taxComponents).values({ id: id(), profileId, name: text(c.name, 80), kind: c.kind || "custom", rateBps, effectiveFrom: c.effectiveFrom || stamp.slice(0, 10), effectiveTo: c.effectiveTo || null, active: c.active !== false, createdAt: stamp, updatedAt: stamp }));
        }
        await (db as any).batch(queries); return Response.json({ ok: true, id: profileId });
      }
      case "saveExpenseCategory": {
        const name = text(body.name, 100); if (!name) throw new Error("Category name is required.");
        await db.insert(s.expenseCategories).values({ id: id(), userId: user.userId, name, createdAt: stamp, updatedAt: stamp }); return ok();
      }
      case "saveExpense": {
        const amountCents = cents(body.amountCents); if (!amountCents) throw new Error("Expense amount must be greater than zero.");
        const rowId = id();
        await (db as any).batch([
          db.insert(s.expenses).values({ id: rowId, userId: user.userId, categoryId: body.categoryId || null, eventId: body.eventId || null, amountCents, expenseDate: body.expenseDate || stamp.slice(0, 10), vendor: text(body.vendor, 120), description: text(body.description, 500) || "Business expense", receiptKey: body.receiptKey || null, createdAt: stamp, updatedAt: stamp }),
          db.insert(s.auditLogs).values({ id: id(), userId: user.userId, action: "create", entityType: "expense", entityId: rowId, details: JSON.stringify({ amountCents }), createdAt: stamp }),
        ]); return ok();
      }
      case "saveEvent": {
        const name = text(body.name, 140); if (!name) throw new Error("Event name is required.");
        const rowId = body.id || id(); const values = { name, location: text(body.location, 200), eventDate: body.eventDate || stamp.slice(0, 10), boothFeeCents: cents(body.boothFeeCents), notes: text(body.notes, 1000), updatedAt: stamp };
        const queries: any[] = [];
        if (body.id) { queries.push(db.update(s.vendorEvents).set(values).where(and(eq(s.vendorEvents.id, rowId), eq(s.vendorEvents.userId, user.userId)))); queries.push(db.delete(s.eventInventory).where(eq(s.eventInventory.eventId, rowId))); }
        else queries.push(db.insert(s.vendorEvents).values({ id: rowId, userId: user.userId, createdAt: stamp, ...values }));
        for (const item of (body.inventory || []).filter((x: any) => whole(x.quantityBrought) > 0)) queries.push(db.insert(s.eventInventory).values({ id: id(), eventId: rowId, productId: item.productId, quantityBrought: whole(item.quantityBrought) }));
        await (db as any).batch(queries); return ok();
      }
      case "saveSettings": {
        await db.update(s.settings).set({ bakeryName: text(body.bakeryName, 140) || "Feather & Flour Bakery", contactEmail: text(body.contactEmail, 200), phone: text(body.phone, 50), address: text(body.address, 300), currency: text(body.currency, 3).toUpperCase() || "USD", defaultTaxProfileId: body.defaultTaxProfileId || null, allowNegativeInventory: !!body.allowNegativeInventory, targetMarginBps: Math.max(1, Math.min(9900, Math.round(Number(body.targetMarginPercent) * 100))), theme: body.theme === "dark" ? "dark" : "light", updatedAt: stamp }).where(eq(s.settings.userId, user.userId)); return ok();
      }
      case "recordSale": return await recordSale(db, user.userId, body, stamp);
      case "changeSaleStatus": return await changeSaleStatus(db, user.userId, body, stamp);
      default: return Response.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 400 });
  }
}

async function recordSale(db: ReturnType<typeof getDb>, userId: string, body: Record<string, any>, stamp: string) {
  const requested = (body.items || []).map((x: any) => ({ productId: String(x.productId), quantity: whole(x.quantity) })).filter((x: any) => x.quantity > 0);
  if (!requested.length) throw new Error("Add at least one product to the sale.");
  const ids: string[] = [...new Set<string>(requested.map((x: any) => String(x.productId)))];
  const [rows, prefs] = await Promise.all([
    db.select().from(s.products).where(and(eq(s.products.userId, userId), inArray(s.products.id, ids), eq(s.products.active, true))),
    db.select().from(s.settings).where(eq(s.settings.userId, userId)).limit(1),
  ]);
  if (rows.length !== ids.length) throw new Error("One or more products are unavailable.");
  const productMap = new Map(rows.map((x) => [x.id, x]));
  const merged = new Map<string, number>(); for (const x of requested) merged.set(x.productId, (merged.get(x.productId) || 0) + x.quantity);
  for (const [productId, quantity] of merged) { const p = productMap.get(productId)!; if (!prefs[0]?.allowNegativeInventory && p.stockQty < quantity) throw new Error(`${p.name} only has ${p.stockQty} in stock.`); }
  const items = [...merged].map(([productId, quantity]) => ({ product: productMap.get(productId)!, quantity }));
  let profile: typeof s.taxProfiles.$inferSelect | undefined; let components: (typeof s.taxComponents.$inferSelect)[] = [];
  if (!body.taxExempt && body.taxProfileId) {
    profile = (await db.select().from(s.taxProfiles).where(and(eq(s.taxProfiles.id, body.taxProfileId), eq(s.taxProfiles.userId, userId), eq(s.taxProfiles.active, true))).limit(1))[0];
    if (profile) components = await db.select().from(s.taxComponents).where(and(eq(s.taxComponents.profileId, profile.id), eq(s.taxComponents.active, true), sql`${s.taxComponents.effectiveFrom} <= ${stamp.slice(0, 10)}`, or(isNull(s.taxComponents.effectiveTo), sql`${s.taxComponents.effectiveTo} >= ${stamp.slice(0, 10)}`)));
  }
  const taxInclusive = !!profile?.taxInclusive;
  const calculated = calculateSaleTotals(
    items.map((x) => ({ unitPriceCents: x.product.priceCents, quantity: x.quantity, taxable: x.product.taxable })),
    cents(body.discountCents),
    components.map((x) => ({ name: x.name, kind: x.kind, rateBps: x.rateBps })),
    taxInclusive,
    !!body.taxExempt,
  );
  const { subtotalCents: subtotal, discountCents: discount, taxableCents: taxable, taxCents: totalTax, totalCents } = calculated;
  const taxRows = calculated.componentTaxes.map((row, i) => ({ component: components[i], amount: row.taxCents }));
  const saleId = id(); const txNumber = `FF-${stamp.slice(0, 10).replaceAll("-", "")}-${saleId.slice(0, 4).toUpperCase()}`;
  const queries: any[] = [db.insert(s.sales).values({ id: saleId, userId, transactionNumber: txNumber, soldAt: body.soldAt || stamp, subtotalCents: subtotal, discountCents: discount, taxableCents: taxable, taxCents: totalTax, totalCents, paymentMethod: text(body.paymentMethod, 40) || "cash", location: text(body.location, 200), eventId: body.eventId || null, taxProfileId: profile?.id || null, taxInclusive, customerName: text(body.customerName, 120), notes: text(body.notes, 1000), createdAt: stamp, updatedAt: stamp })];
  for (const x of items) {
    queries.push(db.insert(s.saleItems).values({ id: id(), saleId, productId: x.product.id, productName: x.product.name, sku: x.product.sku, quantity: x.quantity, unitPriceCents: x.product.priceCents, unitCostCents: x.product.costCents, taxable: x.product.taxable, lineTotalCents: x.product.priceCents * x.quantity }));
    queries.push(db.update(s.products).set({ stockQty: sql`${s.products.stockQty} - ${x.quantity}`, updatedAt: stamp }).where(eq(s.products.id, x.product.id)));
    queries.push(db.insert(s.inventoryTransactions).values({ id: id(), userId, productId: x.product.id, saleId, type: "sale", quantityChange: -x.quantity, reason: txNumber, occurredAt: body.soldAt || stamp }));
  }
  for (const x of taxRows) queries.push(db.insert(s.appliedSaleTaxes).values({ id: id(), saleId, componentName: x.component.name, componentKind: x.component.kind, rateBps: x.component.rateBps, taxableCents: taxable, taxCents: x.amount }));
  queries.push(db.insert(s.auditLogs).values({ id: id(), userId, action: "create", entityType: "sale", entityId: saleId, details: JSON.stringify({ transactionNumber: txNumber, totalCents }), createdAt: stamp }));
  await (db as any).batch(queries); return Response.json({ ok: true, saleId, transactionNumber: txNumber });
}

async function changeSaleStatus(db: ReturnType<typeof getDb>, userId: string, body: Record<string, any>, stamp: string) {
  const status = body.status === "voided" ? "voided" : "refunded";
  const sale = (await db.select().from(s.sales).where(and(eq(s.sales.id, body.saleId), eq(s.sales.userId, userId))).limit(1))[0];
  if (!sale) throw new Error("Sale not found."); if (sale.status !== "completed") throw new Error("This sale has already been reversed.");
  const items = await db.select().from(s.saleItems).where(eq(s.saleItems.saleId, sale.id)); const reversal = inventoryReversal(sale.status, items); const queries: any[] = [];
  queries.push(db.update(s.sales).set({ status, updatedAt: stamp, notes: `${sale.notes}${sale.notes ? "\n" : ""}${status === "voided" ? "Voided" : "Refunded"}: ${text(body.reason, 300) || "No reason provided"}` }).where(eq(s.sales.id, sale.id)));
  for (const item of reversal) { queries.push(db.update(s.products).set({ stockQty: sql`${s.products.stockQty} + ${item.quantityChange}`, updatedAt: stamp }).where(eq(s.products.id, item.productId))); queries.push(db.insert(s.inventoryTransactions).values({ id: id(), userId, productId: item.productId, saleId: sale.id, type: "refund", quantityChange: item.quantityChange, reason: `${status}: ${sale.transactionNumber}`, occurredAt: stamp })); }
  queries.push(db.insert(s.auditLogs).values({ id: id(), userId, action: status, entityType: "sale", entityId: sale.id, details: JSON.stringify({ reason: text(body.reason, 300) }), createdAt: stamp }));
  await (db as any).batch(queries); return ok();
}

async function log(db: ReturnType<typeof getDb>, userId: string, action: string, entityType: string, entityId: string, details: unknown) {
  await db.insert(s.auditLogs).values({ id: id(), userId, action, entityType, entityId, details: JSON.stringify(details), createdAt: now() });
}
function ok() { return Response.json({ ok: true }); }
