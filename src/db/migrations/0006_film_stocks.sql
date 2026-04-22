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
CREATE UNIQUE INDEX `film_stocks_manufacturer_code_unique` ON `film_stocks` (`manufacturer_id`, `code`);
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
