CREATE TABLE `__new_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL CHECK (`category` IN ('FireSafety', 'Plumbing', 'Electrical', 'Ventilation', 'Cleaning', 'Outdoor')),
	`status` text NOT NULL CHECK (`status` IN ('New', 'InProgress', 'Completed', 'Rejected')),
	`pagination_key` text NOT NULL,
	`property_id` text NOT NULL,
	`created_at` text NOT NULL,
	`due_date` text,
	`cost_nok` integer,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_tasks` (
	`id`,
	`title`,
	`description`,
	`category`,
	`status`,
	`pagination_key`,
	`property_id`,
	`created_at`,
	`due_date`,
	`cost_nok`
)
SELECT
	`id`,
	`title`,
	`description`,
	`category`,
	`status`,
	lower(hex(randomblob(16))),
	`property_id`,
	`created_at`,
	`due_date`,
	`cost_nok`
FROM `tasks`;
--> statement-breakpoint
DROP TABLE `tasks`;
--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `tasks_pagination_key_idx` ON `tasks` (`pagination_key`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `tasks_created_cursor_idx` ON `tasks` (`created_at` DESC, `pagination_key` ASC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `tasks_status_created_cursor_idx` ON `tasks` (`status`, `created_at` DESC, `pagination_key` ASC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `tasks_category_created_cursor_idx` ON `tasks` (`category`, `created_at` DESC, `pagination_key` ASC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `tasks_property_created_cursor_idx` ON `tasks` (`property_id`, `created_at` DESC, `pagination_key` ASC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `properties_name_idx` ON `properties` (`name` COLLATE NOCASE);
