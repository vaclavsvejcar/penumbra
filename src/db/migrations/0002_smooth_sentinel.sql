CREATE TABLE `developer_dilutions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`developer_id` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`developer_id`) REFERENCES `developers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `developer_dilutions_developer_code_unique` ON `developer_dilutions` (`developer_id`,`code`);--> statement-breakpoint
ALTER TABLE `negatives` ADD `developer_dilution_id` integer REFERENCES developer_dilutions(id);--> statement-breakpoint
ALTER TABLE `negatives` ADD `dev_time_minutes` real;--> statement-breakpoint
ALTER TABLE `negatives` ADD `dev_temp_c` real;--> statement-breakpoint
INSERT INTO `developer_dilutions` (`code`, `label`, `developer_id`, `sort_order`, `created_at`, `updated_at`)
WITH dils(developer_code, code, label, sort_order) AS (
	VALUES
		-- Film developers
		('d-76',                'stock',  'Stock',      0),
		('d-76',                '1-1',    '1+1',        1),
		('d-76',                '1-3',    '1+3',        2),
		('hc-110',              'b',      'B (1+31)',   0),
		('hc-110',              'h',      'H (1+63)',   1),
		('hc-110',              'e',      'E (1+47)',   2),
		('t-max-developer',     '1-4',    '1+4',        0),
		('t-max-developer',     '1-9',    '1+9',        1),
		('x-tol',               'stock',  'Stock',      0),
		('x-tol',               '1-1',    '1+1',        1),
		('x-tol',               '1-2',    '1+2',        2),
		('x-tol',               '1-3',    '1+3',        3),
		('id-11',               'stock',  'Stock',      0),
		('id-11',               '1-1',    '1+1',        1),
		('id-11',               '1-3',    '1+3',        2),
		('dd-x',                '1-4',    '1+4',        0),
		('dd-x',                '1-9',    '1+9',        1),
		('ilfosol-3',           '1-9',    '1+9',        0),
		('ilfosol-3',           '1-14',   '1+14',       1),
		('microphen',           'stock',  'Stock',      0),
		('microphen',           '1-1',    '1+1',        1),
		('microphen',           '1-3',    '1+3',        2),
		('perceptol',           'stock',  'Stock',      0),
		('perceptol',           '1-1',    '1+1',        1),
		('perceptol',           '1-3',    '1+3',        2),
		('rodinal',             '1-25',   '1+25',       0),
		('rodinal',             '1-50',   '1+50',       1),
		('rodinal',             '1-100',  '1+100',      2),
		('rodinal',             '1-200',  '1+200',      3),
		('fx-39-ii',            '1-9',    '1+9',        0),
		('fx-39-ii',            '1-14',   '1+14',       1),
		('xt-3',                'stock',  'Stock',      0),
		('xt-3',                '1-1',    '1+1',        1),
		('fomadon-r09',         '1-25',   '1+25',       0),
		('fomadon-r09',         '1-50',   '1+50',       1),
		('fomadon-r09',         '1-100',  '1+100',      2),
		('fomadon-lqn',         '1-10',   '1+10',       0),
		('fomadon-lqn',         '1-20',   '1+20',       1),
		('fomadon-excel',       'stock',  'Stock',      0),
		('fomadon-excel',       '1-1',    '1+1',        1),
		('fomadon-excel',       '1-2',    '1+2',        2),
		-- Paper developers
		('dektol',              '1-2',    '1+2',        0),
		('dektol',              '1-3',    '1+3',        1),
		('multigrade-developer','1-9',    '1+9',        0),
		('multigrade-developer','1-14',   '1+14',       1),
		('bromophen',           '1-3',    '1+3',        0),
		('bromophen',           '1-7',    '1+7',        1),
		('warmtone-developer',  '1-9',    '1+9',        0),
		('warmtone-developer',  '1-14',   '1+14',       1),
		('fomatol-lqn',         '1-10',   '1+10',       0),
		('fomatol-lqn',         '1-20',   '1+20',       1),
		('fomatol-pw',          'stock',  'Stock',      0),
		('fomatol-lqr',         '1-9',    '1+9',        0),
		('neutol-plus',         '1-7',    '1+7',        0),
		('neutol-plus',         '1-11',   '1+11',       1),
		('eukobrom-ac',         '1-9',    '1+9',        0),
		('se-6-blue',           'stock',  'Stock',      0),
		-- Universal (film + paper)
		('pq-universal',        '1-9',    '1+9',        0),
		('pq-universal',        '1-19',   '1+19',       1),
		('eco-4812',            '1-14',   '1+14',       0),
		('eco-4812',            '1-19',   '1+19',       1),
		-- Monobath
		('df96-monobath',       'stock',  'Stock',      0)
)
SELECT di.code, di.label, d.id, di.sort_order, unixepoch(), unixepoch()
FROM dils di
JOIN developers d ON d.code = di.developer_code;