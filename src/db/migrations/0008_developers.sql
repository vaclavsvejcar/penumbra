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
CREATE UNIQUE INDEX `developers_manufacturer_code_unique` ON `developers` (`manufacturer_id`, `code`);
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
