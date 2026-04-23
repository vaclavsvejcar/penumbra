import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, isNull, max, ne } from 'drizzle-orm'
import { db } from '#/db/client'
import {
  developerDilutions,
  developers,
  manufacturers,
  type DeveloperDilutionWithDeveloper,
} from '#/db/schema'
import { slugify } from '#/lib/slug'

type DilutionFields = {
  code: string
  label: string
  developerId: number
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
  if (label.length > 40) throw new Error('Label is too long (max 40)')
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

async function assertDeveloperExists(id: number) {
  const row = await db
    .select({ id: developers.id, archivedAt: developers.archivedAt })
    .from(developers)
    .where(eq(developers.id, id))
    .get()
  if (!row) throw new Error('Developer not found')
  if (row.archivedAt) throw new Error('Developer is archived')
}

async function nextSortOrder(developerId: number): Promise<number> {
  const row = await db
    .select({ value: max(developerDilutions.sortOrder) })
    .from(developerDilutions)
    .where(eq(developerDilutions.developerId, developerId))
    .get()
  return (row?.value ?? -1) + 1
}

async function ensureCodeUnique(
  developerId: number,
  code: string,
  excludeId?: number,
) {
  const existing = await db
    .select({ id: developerDilutions.id })
    .from(developerDilutions)
    .where(
      excludeId
        ? and(
            eq(developerDilutions.developerId, developerId),
            eq(developerDilutions.code, code),
            ne(developerDilutions.id, excludeId),
          )
        : and(
            eq(developerDilutions.developerId, developerId),
            eq(developerDilutions.code, code),
          ),
    )
    .get()
  if (existing) {
    throw new Error(`Code "${code}" already exists for this developer`)
  }
}

function joinDilution(row: {
  dilution: typeof developerDilutions.$inferSelect
  developer: typeof developers.$inferSelect
  manufacturer: typeof manufacturers.$inferSelect
}): DeveloperDilutionWithDeveloper {
  return {
    ...row.dilution,
    developer: {
      id: row.developer.id,
      code: row.developer.code,
      label: row.developer.label,
      manufacturer: {
        id: row.manufacturer.id,
        code: row.manufacturer.code,
        label: row.manufacturer.label,
      },
    },
  }
}

export const listDeveloperDilutions = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DeveloperDilutionWithDeveloper[]> => {
    const rows = await db
      .select({
        dilution: developerDilutions,
        developer: developers,
        manufacturer: manufacturers,
      })
      .from(developerDilutions)
      .innerJoin(
        developers,
        eq(developerDilutions.developerId, developers.id),
      )
      .innerJoin(manufacturers, eq(developers.manufacturerId, manufacturers.id))
      .where(isNull(developerDilutions.archivedAt))
      .orderBy(
        asc(developers.label),
        asc(developerDilutions.sortOrder),
        asc(developerDilutions.label),
      )
      .all()
    return rows.map(joinDilution)
  },
)

export const listAllDeveloperDilutions = createServerFn({
  method: 'GET',
}).handler(async (): Promise<DeveloperDilutionWithDeveloper[]> => {
  const rows = await db
    .select({
      dilution: developerDilutions,
      developer: developers,
      manufacturer: manufacturers,
    })
    .from(developerDilutions)
    .innerJoin(developers, eq(developerDilutions.developerId, developers.id))
    .innerJoin(manufacturers, eq(developers.manufacturerId, manufacturers.id))
    .orderBy(
      asc(developers.label),
      asc(developerDilutions.sortOrder),
      asc(developerDilutions.label),
    )
    .all()
  return rows.map(joinDilution)
})

export const createDeveloperDilution = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown): Omit<DilutionFields, 'sortOrder'> & {
    sortOrder?: number
  } => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const input = raw as Record<string, unknown>
    const label = parseLabel(input.label)
    const code = parseCode(input.code, label)
    const developerId = parseId(input.developerId)
    const sortOrder =
      typeof input.sortOrder === 'number' && Number.isInteger(input.sortOrder)
        ? input.sortOrder
        : undefined
    return { label, code, developerId, sortOrder }
  })
  .handler(async ({ data }) => {
    await assertDeveloperExists(data.developerId)
    await ensureCodeUnique(data.developerId, data.code)
    const sortOrder = data.sortOrder ?? (await nextSortOrder(data.developerId))
    const [row] = await db
      .insert(developerDilutions)
      .values({
        code: data.code,
        label: data.label,
        developerId: data.developerId,
        sortOrder,
      })
      .returning()
    return row
  })

export const updateDeveloperDilution = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const input = raw as Record<string, unknown>
    const id = parseId(input.id)
    const patch: Partial<DilutionFields> = {}
    if ('label' in input) patch.label = parseLabel(input.label)
    if ('code' in input) patch.code = parseCode(input.code, patch.label ?? '')
    if ('developerId' in input) patch.developerId = parseId(input.developerId)
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
    if (data.patch.developerId !== undefined) {
      await assertDeveloperExists(data.patch.developerId)
    }
    if (
      data.patch.code !== undefined ||
      data.patch.developerId !== undefined
    ) {
      const existing = await db
        .select({
          code: developerDilutions.code,
          developerId: developerDilutions.developerId,
        })
        .from(developerDilutions)
        .where(eq(developerDilutions.id, data.id))
        .get()
      if (!existing) throw new Error('Dilution not found')
      const finalCode = data.patch.code ?? existing.code
      const finalDevId = data.patch.developerId ?? existing.developerId
      await ensureCodeUnique(finalDevId, finalCode, data.id)
    }
    const [row] = await db
      .update(developerDilutions)
      .set(data.patch)
      .where(eq(developerDilutions.id, data.id))
      .returning()
    if (!row) throw new Error('Dilution not found')
    return row
  })

export const archiveDeveloperDilution = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: id }) => {
    const [row] = await db
      .update(developerDilutions)
      .set({ archivedAt: new Date() })
      .where(eq(developerDilutions.id, id))
      .returning()
    if (!row) throw new Error('Dilution not found')
    return row
  })

export const unarchiveDeveloperDilution = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: id }) => {
    const [row] = await db
      .update(developerDilutions)
      .set({ archivedAt: null })
      .where(eq(developerDilutions.id, id))
      .returning()
    if (!row) throw new Error('Dilution not found')
    return row
  })
