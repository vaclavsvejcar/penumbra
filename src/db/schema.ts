import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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
