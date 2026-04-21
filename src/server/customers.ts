import { createServerFn } from '@tanstack/react-start'
import { desc } from 'drizzle-orm'
import { isValidPhoneNumber } from 'react-phone-number-input'
import { db } from '#/db/client'
import { customerKinds, customers, type CustomerKind } from '#/db/schema'
import { isValidEmail } from '#/lib/validation'

type CreateCustomerInput = {
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

export const listCustomers = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db.select().from(customers).orderBy(desc(customers.createdAt)).all()
  },
)

export const createCustomer = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown): CreateCustomerInput => {
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
  })
  .handler(async ({ data }) => {
    const [row] = await db.insert(customers).values(data).returning()
    return row
  })
