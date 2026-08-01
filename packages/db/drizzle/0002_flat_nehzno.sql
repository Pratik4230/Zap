CREATE TABLE `link_click_milestone_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`link_id` text NOT NULL,
	`milestone` integer NOT NULL,
	`sent_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `link_click_milestone_unique_idx` ON `link_click_milestone_notifications` (`link_id`,`milestone`);
--> statement-breakpoint
CREATE INDEX `link_click_milestone_link_id_idx` ON `link_click_milestone_notifications` (`link_id`);
--> statement-breakpoint
CREATE TABLE `push_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`platform` text DEFAULT 'unknown' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_tokens_token_idx` ON `push_tokens` (`token`);
--> statement-breakpoint
CREATE INDEX `push_tokens_user_id_idx` ON `push_tokens` (`user_id`);
