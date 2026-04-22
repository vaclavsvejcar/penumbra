CREATE TABLE `customer_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_types_code_unique` ON `customer_types` (`code`);
--> statement-breakpoint
INSERT INTO `customer_types` (`code`, `label`, `sort_order`, `created_at`, `updated_at`) VALUES
	('collector', 'Collector', 0, unixepoch(), unixepoch()),
	('gallery', 'Gallery', 1, unixepoch(), unixepoch());
--> statement-breakpoint
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`customer_type_id` integer NOT NULL,
	`email` text,
	`phone` text,
	`city` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_type_id`) REFERENCES `customer_types`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_customers` ("id", "name", "customer_type_id", "email", "phone", "city", "notes", "created_at", "updated_at")
SELECT c.id, c.name, ct.id, c.email, c.phone, c.city, c.notes, c.created_at, c.updated_at
FROM `customers` c
JOIN `customer_types` ct ON ct.code = c.kind;
--> statement-breakpoint
DROP TABLE `customers`;
--> statement-breakpoint
ALTER TABLE `__new_customers` RENAME TO `customers`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
