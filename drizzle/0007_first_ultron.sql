CREATE TABLE `craft_products` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'Handmade' NOT NULL,
	`materials` text DEFAULT '' NOT NULL,
	`dimensions` text DEFAULT '' NOT NULL,
	`price_cents` integer NOT NULL,
	`stock_qty` integer DEFAULT 1 NOT NULL,
	`photo_key` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `craft_products_user_active` ON `craft_products` (`user_id`,`active`);--> statement-breakpoint
CREATE INDEX `craft_products_user_name` ON `craft_products` (`user_id`,`name`);