CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `sync_changes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` text NOT NULL,
	`document_id` text NOT NULL,
	`kind` text NOT NULL,
	`revision` integer NOT NULL,
	`operation_id` text NOT NULL,
	`payload_json` text,
	`deleted_at` text,
	`updated_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sync_changes_workspace_op_idx` ON `sync_changes` (`workspace_id`,`operation_id`);--> statement-breakpoint
CREATE INDEX `sync_changes_workspace_cursor_idx` ON `sync_changes` (`workspace_id`,`id`);--> statement-breakpoint
CREATE TABLE `sync_conflicts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` text NOT NULL,
	`document_id` text NOT NULL,
	`operation_id` text NOT NULL,
	`base_revision` integer NOT NULL,
	`current_revision` integer NOT NULL,
	`payload_json` text,
	`deleted_at` text,
	`device_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sync_conflicts_workspace_op_idx` ON `sync_conflicts` (`workspace_id`,`operation_id`);--> statement-breakpoint
CREATE INDEX `sync_conflicts_workspace_doc_idx` ON `sync_conflicts` (`workspace_id`,`document_id`);--> statement-breakpoint
CREATE TABLE `sync_documents` (
	`workspace_id` text NOT NULL,
	`document_id` text NOT NULL,
	`kind` text NOT NULL,
	`revision` integer NOT NULL,
	`payload_json` text,
	`deleted_at` text,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL,
	PRIMARY KEY(`workspace_id`, `document_id`)
);
--> statement-breakpoint
CREATE TABLE `sync_workspaces` (
	`workspace_id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sync_workspaces_owner_idx` ON `sync_workspaces` (`owner_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
