ALTER TABLE `custom_orders` ADD `sms_consent` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `custom_orders` ADD `sms_consent_at` text;--> statement-breakpoint
ALTER TABLE `custom_orders` ADD `sms_status` text DEFAULT 'not_requested' NOT NULL;--> statement-breakpoint
ALTER TABLE `custom_orders` ADD `sms_last_kind` text;--> statement-breakpoint
ALTER TABLE `custom_orders` ADD `sms_message_sid` text;--> statement-breakpoint
ALTER TABLE `custom_orders` ADD `sms_last_error` text DEFAULT '' NOT NULL;