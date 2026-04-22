import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, isNull, max, ne } from 'drizzle-orm'
import { db } from '#/db/client'
import { manufacturers } from '#/db/schema'
import { slugify } from '#/lib/slug'

type ManufacturerFields = {
  code: string
  label: string
  sortOrder: number
}

function parseId(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isInteger(n) || n <= 0) {
    throw new Error('Invalid id')
  }
  return n
}

function parseLabel(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Label is required')
  const label = value.trim()
  if (label.length === 0) throw new Error('Label is required')
  if (label.length > 80) throw new Error('Label is too long (max 80)')
  return label
}

function parseCode(value: unknown, fallback: string): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  const code = raw.length > 0 ? slugify(raw) : slugify(fallback)
  if (code.length === 0) throw new Error('Code could not be derived from label')
  if (!/^[a-z0-9][a-z0-9-]*$/.test(code)) {
    throw new Error('Code must be kebab-case (a-z, 0-9, dash)')
  }
  return code
}

async function nextSortOrder(): Promise<number> {
  const row = await db
    .select({ value: max(manufacturers.sortOrder) })
    .from(manufacturers)
    .get()
  return (row?.value ?? -1) + 1
}

async function ensureCodeUnique(code: string, excludeId?: number) {
  const existing = await db
    .select({ id: manufacturers.id })
    .from(manufacturers)
    .where(
      excludeId
        ? and(eq(manufacturers.code, code), ne(manufacturers.id, excludeId))
        : eq(manufacturers.code, code),
    )
    .get()
  if (existing) throw new Error(`Code "${code}" already exists`)
}

export const listManufacturers = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select()
      .from(manufacturers)
      .where(isNull(manufacturers.archivedAt))
      .orderBy(asc(manufacturers.sortOrder), asc(manufacturers.label))
      .all()
  },
)

export const listAllManufacturers = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select()
      .from(manufacturers)
      .orderBy(asc(manufacturers.sortOrder), asc(manufacturers.label))
      .all()
  },
)

export const createManufacturer = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown): Omit<ManufacturerFields, 'sortOrder'> & {
    sortOrder?: number
  } => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const input = raw as Record<string, unknown>
    const label = parseLabel(input.label)
    const code = parseCode(input.code, label)
    const sortOrder =
      typeof input.sortOrder === 'number' && Number.isInteger(input.sortOrder)
        ? input.sortOrder
        : undefined
    return { label, code, sortOrder }
  })
  .handler(async ({ data }) => {
    await ensureCodeUnique(data.code)
    const sortOrder = data.sortOrder ?? (await nextSortOrder())
    const [row] = await db
      .insert(manufacturers)
      .values({ code: data.code, label: data.label, sortOrder })
      .returning()
    return row
  })

export const updateManufacturer = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const input = raw as Record<string, unknown>
    const id = parseId(input.id)
    const patch: Partial<ManufacturerFields> = {}
    if ('label' in input) patch.label = parseLabel(input.label)
    if ('code' in input) {
      patch.code = parseCode(input.code, patch.label ?? '')
    }
    if ('sortOrder' in input) {
      const v = input.sortOrder
      if (typeof v !== 'number' || !Number.isInteger(v)) {
        throw new Error('Invalid sortOrder')
      }
      patch.sortOrder = v
    }
    if (Object.keys(patch).length === 0) throw new Error('Nothing to update')
    return { id, patch }
  })
  .handler(async ({ data }) => {
    if (data.patch.code) {
      await ensureCodeUnique(data.patch.code, data.id)
    }
    const [row] = await db
      .update(manufacturers)
      .set(data.patch)
      .where(eq(manufacturers.id, data.id))
      .returning()
    if (!row) throw new Error('Manufacturer not found')
    return row
  })

export const archiveManufacturer = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: id }) => {
    const [row] = await db
      .update(manufacturers)
      .set({ archivedAt: new Date() })
      .where(eq(manufacturers.id, id))
      .returning()
    if (!row) throw new Error('Manufacturer not found')
    return row
  })

export const unarchiveManufacturer = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: id }) => {
    const [row] = await db
      .update(manufacturers)
      .set({ archivedAt: null })
      .where(eq(manufacturers.id, id))
      .returning()
    if (!row) throw new Error('Manufacturer not found')
    return row
  })
