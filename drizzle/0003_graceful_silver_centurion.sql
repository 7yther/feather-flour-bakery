CREATE TABLE `custom_order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`offering_id` text NOT NULL,
	`offering_name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_cents` integer
);
--> statement-breakpoint
CREATE INDEX `custom_order_items_order` ON `custom_order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `custom_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`order_number` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`customer_name` text NOT NULL,
	`customer_email` text DEFAULT '' NOT NULL,
	`customer_phone` text NOT NULL,
	`address_1` text NOT NULL,
	`address_2` text DEFAULT '' NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`postal_code` text NOT NULL,
	`requested_at` text NOT NULL,
	`occasion` text DEFAULT '' NOT NULL,
	`theme` text DEFAULT '' NOT NULL,
	`colors` text DEFAULT '' NOT NULL,
	`personalization` text DEFAULT '' NOT NULL,
	`allergy_notes` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`email_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `custom_orders_number` ON `custom_orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `custom_orders_user_date` ON `custom_orders` (`user_id`,`requested_at`);