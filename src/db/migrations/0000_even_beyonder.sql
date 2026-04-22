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
CREATE UNIQUE INDEX `customer_types_code_unique` ON `customer_types` (`code`);--> statement-breakpoint
CREATE TABLE `customers` (
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
CREATE TABLE `developers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`manufacturer_id` integer NOT NULL,
	`applies_to` text NOT NULL,
	`form` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `developers_manufacturer_code_unique` ON `developers` (`manufacturer_id`,`code`);--> statement-breakpoint
CREATE TABLE `film_stocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`manufacturer_id` integer NOT NULL,
	`iso` integer NOT NULL,
	`type` text NOT NULL,
	`process` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `film_stocks_manufacturer_code_unique` ON `film_stocks` (`manufacturer_id`,`code`);--> statement-breakpoint
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
CREATE UNIQUE INDEX `manufacturers_code_unique` ON `manufacturers` (`code`);--> statement-breakpoint
CREATE TABLE `paper_stocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`manufacturer_id` integer NOT NULL,
	`base` text NOT NULL,
	`tone` text NOT NULL,
	`contrast` text NOT NULL,
	`grade` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `paper_stocks_manufacturer_code_unique` ON `paper_stocks` (`manufacturer_id`,`code`);--> statement-breakpoint
CREATE TABLE `ping` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `customer_types` (`code`, `label`, `sort_order`, `created_at`, `updated_at`) VALUES
	('collector', 'Collector', 0, unixepoch(), unixepoch()),
	('gallery', 'Gallery', 1, unixepoch(), unixepoch());
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
--> statement-breakpoint
INSERT INTO `film_stocks` (`code`, `label`, `manufacturer_id`, `iso`, `type`, `process`, `sort_order`, `created_at`, `updated_at`)
WITH stocks(code, label, manufacturer_code, iso, type, process, sort_order) AS (
	VALUES
		('tri-x-400',           'Tri-X 400',            'kodak',     400,  'bw',        'bw',          0),
		('tmax-100',            'T-Max 100',            'kodak',     100,  'bw',        'bw',          1),
		('tmax-400',            'T-Max 400',            'kodak',     400,  'bw',        'bw',          2),
		('portra-160',          'Portra 160',           'kodak',     160,  'color_neg', 'c41',         3),
		('portra-400',          'Portra 400',           'kodak',     400,  'color_neg', 'c41',         4),
		('portra-800',          'Portra 800',           'kodak',     800,  'color_neg', 'c41',         5),
		('ektar-100',           'Ektar 100',            'kodak',     100,  'color_neg', 'c41',         6),
		('gold-200',            'Gold 200',             'kodak',     200,  'color_neg', 'c41',         7),
		('ektachrome-e100',     'Ektachrome E100',      'kodak',     100,  'slide',     'e6',          8),
		('hp5-plus',            'HP5 Plus',             'ilford',    400,  'bw',        'bw',          9),
		('fp4-plus',            'FP4 Plus',             'ilford',    125,  'bw',        'bw',         10),
		('delta-100',           'Delta 100',            'ilford',    100,  'bw',        'bw',         11),
		('delta-400',           'Delta 400',            'ilford',    400,  'bw',        'bw',         12),
		('delta-3200',          'Delta 3200',           'ilford',   3200,  'bw',        'bw',         13),
		('pan-f-plus',          'Pan F Plus',           'ilford',     50,  'bw',        'bw',         14),
		('sfx-200',             'SFX 200',              'ilford',    200,  'bw',        'bw',         15),
		('xp2-super',           'XP2 Super',            'ilford',    400,  'bw',        'c41',        16),
		('fomapan-100-classic', 'Fomapan 100 Classic',  'foma',      100,  'bw',        'bw',         17),
		('fomapan-200-creative','Fomapan 200 Creative', 'foma',      200,  'bw',        'bw',         18),
		('fomapan-400-action',  'Fomapan 400 Action',   'foma',      400,  'bw',        'bw',         19),
		('fomapan-r100',        'Fomapan R100',         'foma',      100,  'bw',        'bw_reversal',20),
		('chs-100-ii',          'CHS 100 II',           'adox',      100,  'bw',        'bw',         21),
		('silvermax',           'Silvermax',            'adox',      100,  'bw',        'bw',         22),
		('hr-50',               'HR-50',                'adox',       50,  'bw',        'bw',         23),
		('pancro-400',          'Pancro 400',           'bergger',   400,  'bw',        'bw',         24),
		('acros-ii-100',        'Acros II 100',         'fujifilm',  100,  'bw',        'bw',         25),
		('velvia-50',           'Velvia 50',            'fujifilm',   50,  'slide',     'e6',         26),
		('provia-100f',         'Provia 100F',          'fujifilm',  100,  'slide',     'e6',         27),
		('rpx-25',              'RPX 25',               'rollei',     25,  'bw',        'bw',         28),
		('rpx-100',             'RPX 100',              'rollei',    100,  'bw',        'bw',         29),
		('rpx-400',             'RPX 400',              'rollei',    400,  'bw',        'bw',         30),
		('infrared-400',        'Infrared 400',         'rollei',    400,  'bw',        'bw',         31),
		('pan-100',             'Pan 100',              'kentmere',  100,  'bw',        'bw',         32),
		('pan-400',             'Pan 400',              'kentmere',  400,  'bw',        'bw',         33),
		('800t',                '800T',                 'cinestill', 800,  'color_neg', 'c41',        34),
		('bwxx',                'BwXX',                 'cinestill', 250,  'bw',        'bw',         35)
)
SELECT s.code, s.label, m.id, s.iso, s.type, s.process, s.sort_order, unixepoch(), unixepoch()
FROM stocks s
JOIN manufacturers m ON m.code = s.manufacturer_code;
--> statement-breakpoint
INSERT INTO `paper_stocks` (`code`, `label`, `manufacturer_id`, `base`, `tone`, `contrast`, `grade`, `sort_order`, `created_at`, `updated_at`)
WITH papers(code, label, manufacturer_code, base, tone, contrast, grade, sort_order) AS (
	VALUES
		('multigrade-v-rc-deluxe',         'Multigrade V RC Deluxe',         'ilford',   'rc', 'neutral', 'variable', NULL,  0),
		('multigrade-v-fb-classic',        'Multigrade V FB Classic',        'ilford',   'fb', 'neutral', 'variable', NULL,  1),
		('multigrade-art-300',             'Multigrade Art 300',             'ilford',   'fb', 'warm',    'variable', NULL,  2),
		('multigrade-rc-warmtone',         'Multigrade RC Warmtone',         'ilford',   'rc', 'warm',    'variable', NULL,  3),
		('multigrade-fb-warmtone-classic', 'Multigrade FB Warmtone Classic', 'ilford',   'fb', 'warm',    'variable', NULL,  4),
		('multigrade-rc-cooltone',         'Multigrade RC Cooltone',         'ilford',   'rc', 'cool',    'variable', NULL,  5),
		('fomabrom-variant-iii-fb',        'Fomabrom Variant III FB',        'foma',     'fb', 'neutral', 'variable', NULL,  6),
		('fomabrom-n111-grade-2',          'Fomabrom N111 Grade 2',          'foma',     'fb', 'neutral', 'graded',   2,     7),
		('fomabrom-n111-grade-3',          'Fomabrom N111 Grade 3',          'foma',     'fb', 'neutral', 'graded',   3,     8),
		('fomaspeed-variant-312-rc',       'Fomaspeed Variant 312 RC',       'foma',     'rc', 'neutral', 'variable', NULL,  9),
		('fomatone-mg-classic-fb',         'Fomatone MG Classic FB',         'foma',     'fb', 'warm',    'variable', NULL, 10),
		('mcc-110-fb',                     'MCC 110 FB',                     'adox',     'fb', 'neutral', 'variable', NULL, 11),
		('mcp-312-rc',                     'MCP 312 RC',                     'adox',     'rc', 'neutral', 'variable', NULL, 12),
		('polywarmtone-fb',                'Polywarmtone FB',                'adox',     'fb', 'warm',    'variable', NULL, 13),
		('prestige-variable-cb-warmtone',  'Prestige Variable CB Warmtone',  'bergger',  'fb', 'warm',    'variable', NULL, 14),
		('prestige-variable-nb-neutral',   'Prestige Variable NB Neutral',   'bergger',  'fb', 'neutral', 'variable', NULL, 15),
		('vc-select-rc',                   'VC Select RC',                   'kentmere', 'rc', 'neutral', 'variable', NULL, 16)
)
SELECT p.code, p.label, m.id, p.base, p.tone, p.contrast, p.grade, p.sort_order, unixepoch(), unixepoch()
FROM papers p
JOIN manufacturers m ON m.code = p.manufacturer_code;
--> statement-breakpoint
INSERT INTO `developers` (`code`, `label`, `manufacturer_id`, `applies_to`, `form`, `sort_order`, `created_at`, `updated_at`)
WITH devs(code, label, manufacturer_code, applies_to, form, sort_order) AS (
	VALUES
		('d-76',                 'D-76',                 'kodak',     'film',  'powder',    0),
		('hc-110',               'HC-110',               'kodak',     'film',  'liquid',    1),
		('t-max-developer',      'T-Max Developer',      'kodak',     'film',  'liquid',    2),
		('x-tol',                'X-Tol',                'kodak',     'film',  'powder',    3),
		('id-11',                'ID-11',                'ilford',    'film',  'powder',    4),
		('dd-x',                 'DD-X',                 'ilford',    'film',  'liquid',    5),
		('ilfosol-3',            'Ilfosol 3',            'ilford',    'film',  'liquid',    6),
		('microphen',            'Microphen',            'ilford',    'film',  'powder',    7),
		('perceptol',            'Perceptol',            'ilford',    'film',  'powder',    8),
		('rodinal',              'Rodinal',              'adox',      'film',  'liquid',    9),
		('fx-39-ii',             'FX-39 II',             'adox',      'film',  'liquid',   10),
		('xt-3',                 'XT-3',                 'adox',      'film',  'powder',   11),
		('fomadon-r09',          'Fomadon R09',          'foma',      'film',  'liquid',   12),
		('fomadon-lqn',          'Fomadon LQN',          'foma',      'film',  'liquid',   13),
		('fomadon-excel',        'Fomadon Excel',        'foma',      'film',  'powder',   14),
		('dektol',               'Dektol',               'kodak',     'paper', 'powder',   15),
		('multigrade-developer', 'Multigrade Developer', 'ilford',    'paper', 'liquid',   16),
		('bromophen',            'Bromophen',            'ilford',    'paper', 'powder',   17),
		('warmtone-developer',   'Warmtone Developer',   'ilford',    'paper', 'liquid',   18),
		('fomatol-lqn',          'Fomatol LQN',          'foma',      'paper', 'liquid',   19),
		('fomatol-pw',           'Fomatol PW',           'foma',      'paper', 'liquid',   20),
		('fomatol-lqr',          'Fomatol LQR',          'foma',      'paper', 'liquid',   21),
		('neutol-plus',          'Neutol Plus',          'adox',      'paper', 'liquid',   22),
		('eukobrom-ac',          'Eukobrom AC',          'tetenal',   'paper', 'liquid',   23),
		('se-6-blue',            'SE 6 Blue',            'moersch',   'paper', 'liquid',   24),
		('pq-universal',         'PQ Universal',         'ilford',    'both',  'liquid',   25),
		('eco-4812',             'ECO 4812',             'moersch',   'both',  'liquid',   26),
		('df96-monobath',        'DF96 Monobath',        'cinestill', 'film',  'monobath', 27)
)
SELECT d.code, d.label, m.id, d.applies_to, d.form, d.sort_order, unixepoch(), unixepoch()
FROM devs d
JOIN manufacturers m ON m.code = d.manufacturer_code;
