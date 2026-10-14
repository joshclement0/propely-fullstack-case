CREATE TABLE IF NOT EXISTS `properties` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL CHECK (`category` IN ('FireSafety', 'Plumbing', 'Electrical', 'Ventilation', 'Cleaning', 'Outdoor')),
	`status` text NOT NULL CHECK (`status` IN ('New', 'InProgress', 'Completed', 'Rejected')),
	`property_id` text NOT NULL,
	`created_at` text NOT NULL,
	`due_date` text,
	`cost_nok` integer,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE no action
);
