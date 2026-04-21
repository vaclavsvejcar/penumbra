import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { isValidPhoneNumber } from 'react-phone-number-input'
import { db } from '#/db/client'
import { customerKinds, customers, type CustomerKind } from '#/db/schema'
import { isValidEmail } from '#/lib/validation'

type CustomerFields = {
  name: string
  kind: CustomerKind
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

function parseCustomerFields(raw: unknown): CustomerFields {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid payload')
  }
  const input = raw as Record<string, unknown>

  const name = typeof input.name === 'string' ? input.name.trim() : ''
  if (name.length === 0) throw new Error('Name is required')

  const kindRaw = typeof input.kind === 'string' ? input.kind : 'collector'
  const kind = (customerKinds as readonly string[]).includes(kindRaw)
    ? (kindRaw as CustomerKind)
    : 'collector'

  const email = nullableTrimmed(input.email)
  if (email !== null && !isValidEmail(email)) {
    throw new Error('Invalid email')
  }

  const phone = nullableTrimmed(input.phone)
  if (phone !== null && !isValidPhoneNumber(phone)) {
    throw new Error('Invalid phone number')
  }

  return {
    name,
    kind,
    email,
    phone,
    city: nullableTrimmed(input.city),
    notes: nullableTrimmed(input.notes),
  }
}

export const listCustomers = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db.select().from(customers).orderBy(desc(customers.createdAt)).all()
  },
)

export const getCustomer = createServerFn({ method: 'GET' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: id }) => {
    const row = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .get()
    return row ?? null
  })

export const createCustomer = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => parseCustomerFields(raw))
  .handler(async ({ data }) => {
    const [row] = await db.insert(customers).values(data).returning()
    return row
  })

export const updateCustomer = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const input = raw as Record<string, unknown>
    return {
      id: parseId(input.id),
      ...parseCustomerFields(input),
    }
  })
  .handler(async ({ data }) => {
    const { id, ...fields } = data
    const [row] = await db
      .update(customers)
      .set(fields)
      .where(eq(customers.id, id))
      .returning()
    if (!row) throw new Error('Customer not found')
    return row
  })
