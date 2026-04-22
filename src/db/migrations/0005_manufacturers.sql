CREATE TABLE `manufacturers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `manufacturers_code_unique` ON `manufacturers` (`code`);
--> statement-breakpoint
INSERT INTO `manufacturers` (`code`, `label`, `sort_order`, `created_at`, `updated_at`) VALUES
	('kodak', 'Kodak', 0, unixepoch(), unixepoch()),
	('ilford', 'Ilford', 1, unixepoch(), unixepoch()),
	('foma', 'Foma', 2, unixepoch(), unixepoch()),
	('adox', 'Adox', 3, unixepoch(), unixepoch()),
	('bergger', 'Bergger', 4, unixepoch(), unixepoch()),
	('fujifilm', 'Fujifilm', 5, unixepoch(), unixepoch()),
	('rollei', 'Rollei', 6, unixepoch(), unixepoch()),
	('kentmere', 'Kentmere', 7, unixepoch(), unixepoch()),
	('cinestill', 'Cinestill', 8, unixepoch(), unixepoch()),
	('lomography', 'Lomography', 9, unixepoch(), unixepoch()),
	('orwo', 'ORWO', 10, unixepoch(), unixepoch()),
	('tetenal', 'Tetenal', 11, unixepoch(), unixepoch()),
	('moersch', 'Moersch', 12, unixepoch(), unixepoch()),
	('paterson', 'Paterson', 13, unixepoch(), unixepoch()),
	('ars-imago', 'Ars-Imago', 14, unixepoch(), unixepoch());
