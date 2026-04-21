CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'collector' NOT NULL,
	`email` text,
	`city` text,
	`notes` text,
	`created_at` integer NOT NULL
);
