CREATE TABLE `frames` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`negative_id` integer NOT NULL,
	`frame_number` integer NOT NULL,
	`subject` text,
	`date_shot` integer,
	`keeper` integer DEFAULT false NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`negative_id`) REFERENCES `negatives`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "frames_number_range" CHECK("frames"."frame_number" BETWEEN 1 AND 36)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `frames_negative_number_unique` ON `frames` (`negative_id`,`frame_number`);--> statement-breakpoint
CREATE TABLE `negatives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`seq_global` integer NOT NULL,
	`year` integer NOT NULL,
	`seq_year` integer NOT NULL,
	`film_stock_id` integer NOT NULL,
	`developer_id` integer,
	`developed_at` integer NOT NULL,
	`dev_notes` text,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`film_stock_id`) REFERENCES `film_stocks`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`developer_id`) REFERENCES `developers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `negatives_seq_global_unique` ON `negatives` (`seq_global`);--> statement-breakpoint
CREATE UNIQUE INDEX `negatives_year_seq_unique` ON `negatives` (`year`,`seq_year`);