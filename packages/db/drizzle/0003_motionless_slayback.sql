CREATE TABLE `streak_days` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `streak_days_user_date_idx` ON `streak_days` (`user_id`,`date`);--> statement-breakpoint
CREATE INDEX `streak_days_user_id_idx` ON `streak_days` (`user_id`);--> statement-breakpoint
CREATE TABLE `streak_rewards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`pro_granted_until` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `streak_rewards_user_id_unique` ON `streak_rewards` (`user_id`);--> statement-breakpoint
CREATE INDEX `streak_rewards_user_id_idx` ON `streak_rewards` (`user_id`);--> statement-breakpoint
ALTER TABLE `user` ADD `last_active_at` integer;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `pro_granted_until` integer;