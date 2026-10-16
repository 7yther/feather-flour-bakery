CREATE TABLE `applied_sale_taxes` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`component_name` text NOT NULL,
	`component_kind` text NOT NULL,
	`rate_bps` integer NOT NULL,
	`taxable_cents` integer NOT NULL,
	`tax_cents` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `applied_taxes_sale` ON `applied_sale_taxes` (`sale_id`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`details` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_user_date` ON `audit_logs` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `event_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity_brought` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_product_unique` ON `event_inventory` (`event_id`,`product_id`);--> statement-breakpoint
CREATE TABLE `expense_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `expense_categories_user_name` ON `expense_categories` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text,
	`event_id` text,
	`amount_cents` integer NOT NULL,
	`expense_date` text NOT NULL,
	`vendor` text DEFAULT '' NOT NULL,
	`description` text NOT NULL,
	`receipt_key` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `expenses_user_date` ON `expenses` (`user_id`,`expense_date`);--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`purchase_cost_cents` integer NOT NULL,
	`purchase_quantity_micros` integer NOT NULL,
	`unit` text NOT NULL,
	`vendor` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ingredients_user_name` ON `ingredients` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `inventory_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`sale_id` text,
	`type` text NOT NULL,
	`quantity_change` integer NOT NULL,
	`reason` text NOT NULL,
	`occurred_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `inventory_user_date` ON `inventory_transactions` (`user_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `inventory_product` ON `inventory_transactions` (`product_id`);--> statement-breakpoint
CREATE TABLE `product_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_categories_user_name` ON `product_categories` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`sku` text NOT NULL,
	`price_cents` integer NOT NULL,
	`cost_cents` integer DEFAULT 0 NOT NULL,
	`packaging_cost_cents` integer DEFAULT 0 NOT NULL,
	`stock_qty` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer DEFAULT 6 NOT NULL,
	`photo_key` text,
	`taxable` integer DEFAULT true NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_user_sku` ON `products` (`user_id`,`sku`);--> statement-breakpoint
CREATE INDEX `products_user_active` ON `products` (`user_id`,`active`);--> statement-breakpoint
CREATE TABLE `recipe_ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`ingredient_id` text NOT NULL,
	`quantity_micros` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipe_ingredient_unique` ON `recipe_ingredients` (`recipe_id`,`ingredient_id`);--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`batch_yield` integer NOT NULL,
	`labor_cost_cents` integer DEFAULT 0 NOT NULL,
	`overhead_cost_cents` integer DEFAULT 0 NOT NULL,
	`packaging_cost_cents` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_product` ON `recipes` (`user_id`,`product_id`);--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`sku` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`unit_cost_cents` integer NOT NULL,
	`taxable` integer NOT NULL,
	`line_total_cents` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sale_items_sale` ON `sale_items` (`sale_id`);--> statement-breakpoint
CREATE INDEX `sale_items_product` ON `sale_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`transaction_number` text NOT NULL,
	`sold_at` text NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`subtotal_cents` integer NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`taxable_cents` integer DEFAULT 0 NOT NULL,
	`tax_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer NOT NULL,
	`payment_method` text NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`event_id` text,
	`tax_profile_id` text,
	`tax_inclusive` integer DEFAULT false NOT NULL,
	`customer_name` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_user_txn` ON `sales` (`user_id`,`transaction_number`);--> statement-breakpoint
CREATE INDEX `sales_user_date` ON `sales` (`user_id`,`sold_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`bakery_name` text DEFAULT 'Feather & Flour Bakery' NOT NULL,
	`contact_email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`address` text DEFAULT 'Mobile, Alabama' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`default_tax_profile_id` text,
	`allow_negative_inventory` integer DEFAULT false NOT NULL,
	`target_margin_bps` integer DEFAULT 6500 NOT NULL,
	`theme` text DEFAULT 'light' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tax_components` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`rate_bps` integer NOT NULL,
	`effective_from` text NOT NULL,
	`effective_to` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tax_components_profile_effective` ON `tax_components` (`profile_id`,`effective_from`);--> statement-breakpoint
CREATE TABLE `tax_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`tax_inclusive` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tax_profiles_user_name` ON `tax_profiles` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vendor_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`location` text NOT NULL,
	`event_date` text NOT NULL,
	`booth_fee_cents` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_user_date` ON `vendor_events` (`user_id`,`event_date`);