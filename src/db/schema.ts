import { sql } from 'drizzle-orm'
import {
  check,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const ping = sqliteTable('ping', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  message: text('message').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const customerTypes = sqliteTable('customer_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  archivedAt: integer('archived_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
})

export type CustomerType = typeof customerTypes.$inferSelect
export type NewCustomerType = typeof customerTypes.$inferInsert

export const manufacturers = sqliteTable('manufacturers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  archivedAt: integer('archived_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
})

export type Manufacturer = typeof manufacturers.$inferSelect
export type NewManufacturer = typeof manufacturers.$inferInsert

export const filmTypes = ['bw', 'color_neg', 'slide'] as const
export type FilmType = (typeof filmTypes)[number]

export const filmProcesses = ['bw', 'c41', 'e6', 'bw_reversal'] as const
export type FilmProcess = (typeof filmProcesses)[number]

export const filmStocks = sqliteTable(
  'film_stocks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    code: text('code').notNull(),
    label: text('label').notNull(),
    manufacturerId: integer('manufacturer_id')
      .notNull()
      .references(() => manufacturers.id, { onDelete: 'restrict' }),
    iso: integer('iso').notNull(),
    type: text('type', { enum: filmTypes }).notNull(),
    process: text('process', { enum: filmProcesses }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('film_stocks_manufacturer_code_unique').on(
      t.manufacturerId,
      t.code,
    ),
  ],
)

export type FilmStock = typeof filmStocks.$inferSelect
export type NewFilmStock = typeof filmStocks.$inferInsert

export type FilmStockWithManufacturer = FilmStock & {
  manufacturer: Pick<Manufacturer, 'id' | 'code' | 'label'>
}

export const paperBases = ['rc', 'fb'] as const
export type PaperBase = (typeof paperBases)[number]

export const paperTones = ['neutral', 'warm', 'cool'] as const
export type PaperTone = (typeof paperTones)[number]

export const paperContrasts = ['variable', 'graded'] as const
export type PaperContrast = (typeof paperContrasts)[number]

export const paperStocks = sqliteTable(
  'paper_stocks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    code: text('code').notNull(),
    label: text('label').notNull(),
    manufacturerId: integer('manufacturer_id')
      .notNull()
      .references(() => manufacturers.id, { onDelete: 'restrict' }),
    base: text('base', { enum: paperBases }).notNull(),
    tone: text('tone', { enum: paperTones }).notNull(),
    contrast: text('contrast', { enum: paperContrasts }).notNull(),
    grade: integer('grade'),
    sortOrder: integer('sort_order').notNull().default(0),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('paper_stocks_manufacturer_code_unique').on(
      t.manufacturerId,
      t.code,
    ),
  ],
)

export type PaperStock = typeof paperStocks.$inferSelect
export type NewPaperStock = typeof paperStocks.$inferInsert

export type PaperStockWithManufacturer = PaperStock & {
  manufacturer: Pick<Manufacturer, 'id' | 'code' | 'label'>
}

export const developerApplies = ['film', 'paper', 'both'] as const
export type DeveloperApplies = (typeof developerApplies)[number]

export const developerForms = ['liquid', 'powder', 'monobath'] as const
export type DeveloperForm = (typeof developerForms)[number]

export const developers = sqliteTable(
  'developers',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    code: text('code').notNull(),
    label: text('label').notNull(),
    manufacturerId: integer('manufacturer_id')
      .notNull()
      .references(() => manufacturers.id, { onDelete: 'restrict' }),
    appliesTo: text('applies_to', { enum: developerApplies }).notNull(),
    form: text('form', { enum: developerForms }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('developers_manufacturer_code_unique').on(
      t.manufacturerId,
      t.code,
    ),
  ],
)

export type Developer = typeof developers.$inferSelect
export type NewDeveloper = typeof developers.$inferInsert

export type DeveloperWithManufacturer = Developer & {
  manufacturer: Pick<Manufacturer, 'id' | 'code' | 'label'>
}

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  customerTypeId: integer('customer_type_id')
    .notNull()
    .references(() => customerTypes.id, { onDelete: 'restrict' }),
  email: text('email'),
  phone: text('phone'),
  city: text('city'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
})

export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert

export type CustomerWithType = Customer & {
  customerType: Pick<CustomerType, 'id' | 'code' | 'label'>
}

export const negatives = sqliteTable(
  'negatives',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    seqGlobal: integer('seq_global').notNull().unique(),
    year: integer('year').notNull(),
    seqYear: integer('seq_year').notNull(),
    filmStockId: integer('film_stock_id')
      .notNull()
      .references(() => filmStocks.id, { onDelete: 'restrict' }),
    developerId: integer('developer_id').references(() => developers.id, {
      onDelete: 'restrict',
    }),
    developedAt: integer('developed_at', { mode: 'timestamp' }).notNull(),
    devNotes: text('dev_notes'),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex('negatives_year_seq_unique').on(t.year, t.seqYear)],
)

export type Negative = typeof negatives.$inferSelect
export type NewNegative = typeof negatives.$inferInsert

export type NegativeFilmStock = Pick<
  FilmStock,
  'id' | 'code' | 'label' | 'iso' | 'type' | 'process'
> & {
  manufacturer: Pick<Manufacturer, 'id' | 'code' | 'label'>
}

export type NegativeDeveloper = Pick<Developer, 'id' | 'code' | 'label'> & {
  manufacturer: Pick<Manufacturer, 'id' | 'code' | 'label'>
}

export type NegativeWithRefs = Negative & {
  filmStock: NegativeFilmStock
  developer: NegativeDeveloper | null
  frameCount: number
  keeperCount: number
}

export const frames = sqliteTable(
  'frames',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    negativeId: integer('negative_id')
      .notNull()
      .references(() => negatives.id, { onDelete: 'restrict' }),
    frameNumber: integer('frame_number').notNull(),
    subject: text('subject'),
    dateShot: integer('date_shot', { mode: 'timestamp' }),
    keeper: integer('keeper', { mode: 'boolean' }).notNull().default(false),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('frames_negative_number_unique').on(
      t.negativeId,
      t.frameNumber,
    ),
    check('frames_number_range', sql`${t.frameNumber} BETWEEN 1 AND 36`),
  ],
)

export type Frame = typeof frames.$inferSelect
export type NewFrame = typeof frames.$inferInsert

export type FrameWithNegative = Frame & {
  negative: Pick<Negative, 'id' | 'seqGlobal' | 'year' | 'seqYear'>
}

export type NegativeSearchItem = Pick<
  Negative,
  | 'id'
  | 'seqGlobal'
  | 'year'
  | 'seqYear'
  | 'developedAt'
  | 'archivedAt'
  | 'devNotes'
> & {
  filmStock: NegativeFilmStock
  developer: NegativeDeveloper | null
}

export type FrameSearchItem = Pick<
  Frame,
  'id' | 'frameNumber' | 'subject' | 'dateShot' | 'keeper' | 'notes'
> & {
  negative: Pick<Negative, 'id' | 'seqGlobal' | 'year' | 'seqYear'>
}
