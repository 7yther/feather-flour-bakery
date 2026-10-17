ALTER TABLE `vendor_events` ADD `booth_number` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `vendor_events` ADD `photo_key` text;--> statement-breakpoint
ALTER TABLE `vendor_events` ADD `public_visible` integer DEFAULT true NOT NULL;