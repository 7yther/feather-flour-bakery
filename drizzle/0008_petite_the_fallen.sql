CREATE TABLE `customer_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_email` text DEFAULT '' NOT NULL,
	`rating` integer NOT NULL,
	`message` text NOT NULL,
	`approved` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `customer_feedback_user_approved` ON `customer_feedback` (`user_id`,`approved`);--> statement-breakpoint
CREATE INDEX `customer_feedback_user_date` ON `customer_feedback` (`user_id`,`created_at`);