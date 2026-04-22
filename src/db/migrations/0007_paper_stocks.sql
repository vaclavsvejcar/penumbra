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
CREATE UNIQUE INDEX `paper_stocks_manufacturer_code_unique` ON `paper_stocks` (`manufacturer_id`, `code`);
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
