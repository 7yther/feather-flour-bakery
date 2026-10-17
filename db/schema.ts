import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), email: text("email").notNull(), displayName: text("display_name").notNull(), ...timestamps,
});

export const appUsers = sqliteTable("app_users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["owner", "staff"] }).notNull().default("staff"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
}, (t) => [uniqueIndex("app_users_username").on(t.username)]);

export const appSessions = sqliteTable("app_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
}, (t) => [uniqueIndex("app_sessions_token_hash").on(t.tokenHash), index("app_sessions_user").on(t.userId)]);

export const settings = sqliteTable("settings", {
  userId: text("user_id").primaryKey(), bakeryName: text("bakery_name").notNull().default("Feather & Flour Bakery"),
  contactEmail: text("contact_email").notNull().default(""), phone: text("phone").notNull().default(""),
  address: text("address").notNull().default("Mobile, Alabama"), currency: text("currency").notNull().default("USD"),
  defaultTaxProfileId: text("default_tax_profile_id"), allowNegativeInventory: integer("allow_negative_inventory", { mode: "boolean" }).notNull().default(false),
  targetMarginBps: integer("target_margin_bps").notNull().default(6500), theme: text("theme").notNull().default("light"), updatedAt: text("updated_at").notNull(),
});

export const productCategories = sqliteTable("product_categories", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), name: text("name").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (t) => [uniqueIndex("product_categories_user_name").on(t.userId, t.name)]);

export const products = sqliteTable("products", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), categoryId: text("category_id"), name: text("name").notNull(),
  description: text("description").notNull().default(""), sku: text("sku").notNull(), priceCents: integer("price_cents").notNull(),
  costCents: integer("cost_cents").notNull().default(0), packagingCostCents: integer("packaging_cost_cents").notNull().default(0),
  stockQty: integer("stock_qty").notNull().default(0), lowStockThreshold: integer("low_stock_threshold").notNull().default(6), photoKey: text("photo_key"),
  taxable: integer("taxable", { mode: "boolean" }).notNull().default(true), active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (t) => [uniqueIndex("products_user_sku").on(t.userId, t.sku), index("products_user_active").on(t.userId, t.active)]);

export const customOrders = sqliteTable("custom_orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  orderNumber: text("order_number").notNull(),
  status: text("status", { enum: ["new", "confirmed", "fulfilled", "cancelled"] }).notNull().default("new"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull().default(""),
  customerPhone: text("customer_phone").notNull(),
  address1: text("address_1").notNull(),
  address2: text("address_2").notNull().default(""),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  requestedAt: text("requested_at").notNull(),
  occasion: text("occasion").notNull().default(""),
  theme: text("theme").notNull().default(""),
  colors: text("colors").notNull().default(""),
  personalization: text("personalization").notNull().default(""),
  allergyNotes: text("allergy_notes").notNull().default(""),
  notes: text("notes").notNull().default(""),
  emailStatus: text("email_status", { enum: ["sent", "pending", "failed"] }).notNull().default("pending"),
  ...timestamps,
}, (t) => [uniqueIndex("custom_orders_number").on(t.orderNumber), index("custom_orders_user_date").on(t.userId, t.requestedAt)]);

export const customOrderItems = sqliteTable("custom_order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  offeringId: text("offering_id").notNull(),
  offeringName: text("offering_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents"),
}, (t) => [index("custom_order_items_order").on(t.orderId)]);

export const ingredients = sqliteTable("ingredients", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), name: text("name").notNull(), purchaseCostCents: integer("purchase_cost_cents").notNull(),
  purchaseQuantityMicros: integer("purchase_quantity_micros").notNull(), unit: text("unit").notNull(), vendor: text("vendor").notNull().default(""), ...timestamps,
}, (t) => [uniqueIndex("ingredients_user_name").on(t.userId, t.name)]);

export const recipes = sqliteTable("recipes", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), productId: text("product_id").notNull(), name: text("name").notNull(),
  batchYield: integer("batch_yield").notNull(), laborCostCents: integer("labor_cost_cents").notNull().default(0),
  overheadCostCents: integer("overhead_cost_cents").notNull().default(0), packagingCostCents: integer("packaging_cost_cents").notNull().default(0),
  notes: text("notes").notNull().default(""), ...timestamps,
}, (t) => [uniqueIndex("recipes_product").on(t.userId, t.productId)]);

export const recipeIngredients = sqliteTable("recipe_ingredients", {
  id: text("id").primaryKey(), recipeId: text("recipe_id").notNull(), ingredientId: text("ingredient_id").notNull(), quantityMicros: integer("quantity_micros").notNull(),
}, (t) => [uniqueIndex("recipe_ingredient_unique").on(t.recipeId, t.ingredientId)]);

export const taxProfiles = sqliteTable("tax_profiles", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), name: text("name").notNull(), location: text("location").notNull().default(""),
  taxInclusive: integer("tax_inclusive", { mode: "boolean" }).notNull().default(false), active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (t) => [uniqueIndex("tax_profiles_user_name").on(t.userId, t.name)]);

export const taxComponents = sqliteTable("tax_components", {
  id: text("id").primaryKey(), profileId: text("profile_id").notNull(), name: text("name").notNull(),
  kind: text("kind", { enum: ["state", "county", "city", "custom"] }).notNull(), rateBps: integer("rate_bps").notNull(),
  effectiveFrom: text("effective_from").notNull(), effectiveTo: text("effective_to"), active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (t) => [index("tax_components_profile_effective").on(t.profileId, t.effectiveFrom)]);

export const vendorEvents = sqliteTable("vendor_events", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), name: text("name").notNull(), location: text("location").notNull(),
  eventDate: text("event_date").notNull(), boothFeeCents: integer("booth_fee_cents").notNull().default(0), boothNumber: text("booth_number").notNull().default(""),
  photoKey: text("photo_key"), publicVisible: integer("public_visible", { mode: "boolean" }).notNull().default(true), notes: text("notes").notNull().default(""), ...timestamps,
}, (t) => [index("events_user_date").on(t.userId, t.eventDate)]);

export const eventInventory = sqliteTable("event_inventory", {
  id: text("id").primaryKey(), eventId: text("event_id").notNull(), productId: text("product_id").notNull(), quantityBrought: integer("quantity_brought").notNull().default(0),
}, (t) => [uniqueIndex("event_product_unique").on(t.eventId, t.productId)]);

export const sales = sqliteTable("sales", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), transactionNumber: text("transaction_number").notNull(), soldAt: text("sold_at").notNull(),
  status: text("status", { enum: ["completed", "refunded", "voided"] }).notNull().default("completed"), subtotalCents: integer("subtotal_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0), taxableCents: integer("taxable_cents").notNull().default(0), taxCents: integer("tax_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(), paymentMethod: text("payment_method").notNull(), location: text("location").notNull().default(""),
  eventId: text("event_id"), taxProfileId: text("tax_profile_id"), taxInclusive: integer("tax_inclusive", { mode: "boolean" }).notNull().default(false),
  customerName: text("customer_name").notNull().default(""), notes: text("notes").notNull().default(""), ...timestamps,
}, (t) => [uniqueIndex("sales_user_txn").on(t.userId, t.transactionNumber), index("sales_user_date").on(t.userId, t.soldAt)]);

export const saleItems = sqliteTable("sale_items", {
  id: text("id").primaryKey(), saleId: text("sale_id").notNull(), productId: text("product_id").notNull(), productName: text("product_name").notNull(),
  sku: text("sku").notNull(), quantity: integer("quantity").notNull(), unitPriceCents: integer("unit_price_cents").notNull(), unitCostCents: integer("unit_cost_cents").notNull(),
  taxable: integer("taxable", { mode: "boolean" }).notNull(), lineTotalCents: integer("line_total_cents").notNull(),
}, (t) => [index("sale_items_sale").on(t.saleId), index("sale_items_product").on(t.productId)]);

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(), saleId: text("sale_id").notNull(), amountCents: integer("amount_cents").notNull(),
  method: text("method").notNull(), reference: text("reference").notNull().default(""), createdAt: text("created_at").notNull(),
}, (t) => [index("payments_sale").on(t.saleId)]);

export const appliedSaleTaxes = sqliteTable("applied_sale_taxes", {
  id: text("id").primaryKey(), saleId: text("sale_id").notNull(), componentName: text("component_name").notNull(), componentKind: text("component_kind").notNull(),
  rateBps: integer("rate_bps").notNull(), taxableCents: integer("taxable_cents").notNull(), taxCents: integer("tax_cents").notNull(),
}, (t) => [index("applied_taxes_sale").on(t.saleId)]);

export const inventoryTransactions = sqliteTable("inventory_transactions", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), productId: text("product_id").notNull(), saleId: text("sale_id"),
  type: text("type", { enum: ["produced", "sale", "refund", "adjustment", "damaged", "discarded"] }).notNull(),
  quantityChange: integer("quantity_change").notNull(), reason: text("reason").notNull(), occurredAt: text("occurred_at").notNull(),
}, (t) => [index("inventory_user_date").on(t.userId, t.occurredAt), index("inventory_product").on(t.productId)]);

export const expenseCategories = sqliteTable("expense_categories", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), name: text("name").notNull(), active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (t) => [uniqueIndex("expense_categories_user_name").on(t.userId, t.name)]);

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), categoryId: text("category_id"), eventId: text("event_id"),
  amountCents: integer("amount_cents").notNull(), expenseDate: text("expense_date").notNull(), vendor: text("vendor").notNull().default(""),
  description: text("description").notNull(), receiptKey: text("receipt_key"), ...timestamps,
}, (t) => [index("expenses_user_date").on(t.userId, t.expenseDate)]);

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), action: text("action").notNull(), entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(), details: text("details").notNull().default("{}"), createdAt: text("created_at").notNull(),
}, (t) => [index("audit_user_date").on(t.userId, t.createdAt)]);
