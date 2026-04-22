import { sql } from 'drizzle-orm'
import {
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
