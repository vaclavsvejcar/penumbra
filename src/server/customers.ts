import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { isValidPhoneNumber } from 'react-phone-number-input'
import { db } from '#/db/client'
import {
  customers,
  customerTypes,
  type CustomerWithType,
} from '#/db/schema'
import { isValidEmail } from '#/lib/validation'

type CustomerFields = {
  name: string
  customerTypeId: number
  email: string | null
  phone: string | null
  city: string | null
  notes: string | null
}

function nullableTrimmed(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function parseId(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isInteger(n) || n <= 0) {
    throw new Error('Invalid id')
  }
  return n
}

async function assertCustomerTypeExists(id: number) {
  const row = await db
    .select({ id: customerTypes.id, archivedAt: customerTypes.archivedAt })
    .from(customerTypes)
    .where(eq(customerTypes.id, id))
    .get()
  if (!row) throw new Error('Customer type not found')
  if (row.archivedAt) throw new Error('Customer type is archived')
}

function parseCustomerPatch(raw: unknown): Partial<CustomerFields> {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid payload')
  }
  const input = raw as Record<string, unknown>
  const patch: Partial<CustomerFields> = {}

  if ('name' in input) {
    const name = typeof input.name === 'string' ? input.name.trim() : ''
    if (name.length === 0) throw new Error('Name is required')
    patch.name = name
  }

  if ('customerTypeId' in input) {
    patch.customerTypeId = parseId(input.customerTypeId)
  }

  if ('email' in input) {
    const email = nullableTrimmed(input.email)
    if (email !== null && !isValidEmail(email)) {
      throw new Error('Invalid email')
    }
    patch.email = email
  }

  if ('phone' in input) {
    const phone = nullableTrimmed(input.phone)
    if (phone !== null && !isValidPhoneNumber(phone)) {
      throw new Error('Invalid phone number')
    }
    patch.phone = phone
  }

  if ('city' in input) {
    patch.city = nullableTrimmed(input.city)
  }

  if ('notes' in input) {
    patch.notes = nullableTrimmed(input.notes)
  }

  return patch
}

function parseCustomerFields(raw: unknown): CustomerFields {
  const patch = parseCustomerPatch(raw)
  if (patch.name === undefined) throw new Error('Name is required')
  if (patch.customerTypeId === undefined) {
    throw new Error('Customer type is required')
  }
  return {
    name: patch.name,
    customerTypeId: patch.customerTypeId,
    email: patch.email ?? null,
    phone: patch.phone ?? null,
    city: patch.city ?? null,
    notes: patch.notes ?? null,
  }
}

function joinCustomer(row: {
  customer: typeof customers.$inferSelect
  customerType: typeof customerTypes.$inferSelect
}): CustomerWithType {
  return {
    ...row.customer,
    customerType: {
      id: row.customerType.id,
      code: row.customerType.code,
      label: row.customerType.label,
    },
  }
}

export const listCustomers = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CustomerWithType[]> => {
    const rows = await db
      .select({ customer: customers, customerType: customerTypes })
      .from(customers)
      .innerJoin(customerTypes, eq(customers.customerTypeId, customerTypes.id))
      .orderBy(desc(customers.createdAt))
      .all()
    return rows.map(joinCustomer)
  },
)

export const getCustomer = createServerFn({ method: 'GET' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: id }): Promise<CustomerWithType | null> => {
    const row = await db
      .select({ customer: customers, customerType: customerTypes })
      .from(customers)
      .innerJoin(customerTypes, eq(customers.customerTypeId, customerTypes.id))
      .where(eq(customers.id, id))
      .get()
    return row ? joinCustomer(row) : null
  })

export const createCustomer = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => parseCustomerFields(raw))
  .handler(async ({ data }) => {
    await assertCustomerTypeExists(data.customerTypeId)
    const [row] = await db.insert(customers).values(data).returning()
    return row
  })

export const updateCustomer = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const input = raw as Record<string, unknown>
    const id = parseId(input.id)
    const patch = parseCustomerPatch(input)
    if (Object.keys(patch).length === 0) throw new Error('Nothing to update')
    return { id, ...patch }
  })
  .handler(async ({ data }) => {
    const { id, ...patch } = data
    if (patch.customerTypeId !== undefined) {
      await assertCustomerTypeExists(patch.customerTypeId)
    }
    const [row] = await db
      .update(customers)
      .set(patch)
      .where(eq(customers.id, id))
      .returning()
    if (!row) throw new Error('Customer not found')
    return row
  })
