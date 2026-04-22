import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, isNull, max, ne } from 'drizzle-orm'
import { db } from '#/db/client'
import {
  developerApplies,
  developerForms,
  developers,
  manufacturers,
  type DeveloperApplies,
  type DeveloperForm,
  type DeveloperWithManufacturer,
} from '#/db/schema'
import { slugify } from '#/lib/slug'

type DeveloperFields = {
  code: string
  label: string
  manufacturerId: number
  appliesTo: DeveloperApplies
  form: DeveloperForm
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

function parseAppliesTo(value: unknown): DeveloperApplies {
  if (
    typeof value !== 'string' ||
    !(developerApplies as readonly string[]).includes(value)
  ) {
    throw new Error(`Applies to must be one of: ${developerApplies.join(', ')}`)
  }
  return value as DeveloperApplies
}

function parseForm(value: unknown): DeveloperForm {
  if (
    typeof value !== 'string' ||
    !(developerForms as readonly string[]).includes(value)
  ) {
    throw new Error(`Form must be one of: ${developerForms.join(', ')}`)
  }
  return value as DeveloperForm
}

async function assertManufacturerExists(id: number) {
  const row = await db
    .select({ id: manufacturers.id, archivedAt: manufacturers.archivedAt })
    .from(manufacturers)
    .where(eq(manufacturers.id, id))
    .get()
  if (!row) throw new Error('Manufacturer not found')
  if (row.archivedAt) throw new Error('Manufacturer is archived')
}

async function nextSortOrder(): Promise<number> {
  const row = await db
    .select({ value: max(developers.sortOrder) })
    .from(developers)
    .get()
  return (row?.value ?? -1) + 1
}

async function ensureCodeUnique(
  manufacturerId: number,
  code: string,
  excludeId?: number,
) {
  const existing = await db
    .select({ id: developers.id })
    .from(developers)
    .where(
      excludeId
        ? and(
            eq(developers.manufacturerId, manufacturerId),
            eq(developers.code, code),
            ne(developers.id, excludeId),
          )
        : and(
            eq(developers.manufacturerId, manufacturerId),
            eq(developers.code, code),
          ),
    )
    .get()
  if (existing) {
    throw new Error(`Code "${code}" already exists for this manufacturer`)
  }
}

function joinDeveloper(row: {
  developer: typeof developers.$inferSelect
  manufacturer: typeof manufacturers.$inferSelect
}): DeveloperWithManufacturer {
  return {
    ...row.developer,
    manufacturer: {
      id: row.manufacturer.id,
      code: row.manufacturer.code,
      label: row.manufacturer.label,
    },
  }
}

export const listDevelopers = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DeveloperWithManufacturer[]> => {
    const rows = await db
      .select({ developer: developers, manufacturer: manufacturers })
      .from(developers)
      .innerJoin(manufacturers, eq(developers.manufacturerId, manufacturers.id))
      .where(isNull(developers.archivedAt))
      .orderBy(asc(developers.sortOrder), asc(developers.label))
      .all()
    return rows.map(joinDeveloper)
  },
)

export const listAllDevelopers = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DeveloperWithManufacturer[]> => {
    const rows = await db
      .select({ developer: developers, manufacturer: manufacturers })
      .from(developers)
      .innerJoin(manufacturers, eq(developers.manufacturerId, manufacturers.id))
      .orderBy(asc(developers.sortOrder), asc(developers.label))
      .all()
    return rows.map(joinDeveloper)
  },
)

export const createDeveloper = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown): Omit<DeveloperFields, 'sortOrder'> & {
    sortOrder?: number
  } => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const input = raw as Record<string, unknown>
    const label = parseLabel(input.label)
    const code = parseCode(input.code, label)
    const manufacturerId = parseId(input.manufacturerId)
    const appliesTo = parseAppliesTo(input.appliesTo)
    const form = parseForm(input.form)
    const sortOrder =
      typeof input.sortOrder === 'number' && Number.isInteger(input.sortOrder)
        ? input.sortOrder
        : undefined
    return { label, code, manufacturerId, appliesTo, form, sortOrder }
  })
  .handler(async ({ data }) => {
    await assertManufacturerExists(data.manufacturerId)
    await ensureCodeUnique(data.manufacturerId, data.code)
    const sortOrder = data.sortOrder ?? (await nextSortOrder())
    const [row] = await db
      .insert(developers)
      .values({
        code: data.code,
        label: data.label,
        manufacturerId: data.manufacturerId,
        appliesTo: data.appliesTo,
        form: data.form,
        sortOrder,
      })
      .returning()
    return row
  })

export const updateDeveloper = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const input = raw as Record<string, unknown>
    const id = parseId(input.id)
    const patch: Partial<DeveloperFields> = {}
    if ('label' in input) patch.label = parseLabel(input.label)
    if ('code' in input) patch.code = parseCode(input.code, patch.label ?? '')
    if ('manufacturerId' in input) {
      patch.manufacturerId = parseId(input.manufacturerId)
    }
    if ('appliesTo' in input) patch.appliesTo = parseAppliesTo(input.appliesTo)
    if ('form' in input) patch.form = parseForm(input.form)
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
    if (data.patch.manufacturerId !== undefined) {
      await assertManufacturerExists(data.patch.manufacturerId)
    }
    if (
      data.patch.code !== undefined ||
      data.patch.manufacturerId !== undefined
    ) {
      const existing = await db
        .select({
          code: developers.code,
          manufacturerId: developers.manufacturerId,
        })
        .from(developers)
        .where(eq(developers.id, data.id))
        .get()
      if (!existing) throw new Error('Developer not found')
      const finalCode = data.patch.code ?? existing.code
      const finalMfgId = data.patch.manufacturerId ?? existing.manufacturerId
      await ensureCodeUnique(finalMfgId, finalCode, data.id)
    }
    const [row] = await db
      .update(developers)
      .set(data.patch)
      .where(eq(developers.id, data.id))
      .returning()
    if (!row) throw new Error('Developer not found')
    return row
  })

export const archiveDeveloper = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: id }) => {
    const [row] = await db
      .update(developers)
      .set({ archivedAt: new Date() })
      .where(eq(developers.id, id))
      .returning()
    if (!row) throw new Error('Developer not found')
    return row
  })

export const unarchiveDeveloper = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: id }) => {
    const [row] = await db
      .update(developers)
      .set({ archivedAt: null })
      .where(eq(developers.id, id))
      .returning()
    if (!row) throw new Error('Developer not found')
    return row
  })
