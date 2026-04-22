import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, isNull, max, ne } from 'drizzle-orm'
import { db } from '#/db/client'
import {
  manufacturers,
  paperBases,
  paperContrasts,
  paperStocks,
  paperTones,
  type PaperBase,
  type PaperContrast,
  type PaperStockWithManufacturer,
  type PaperTone,
} from '#/db/schema'
import { slugify } from '#/lib/slug'

type PaperStockFields = {
  code: string
  label: string
  manufacturerId: number
  base: PaperBase
  tone: PaperTone
  contrast: PaperContrast
  grade: number | null
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

function parseBase(value: unknown): PaperBase {
  if (
    typeof value !== 'string' ||
    !(paperBases as readonly string[]).includes(value)
  ) {
    throw new Error(`Base must be one of: ${paperBases.join(', ')}`)
  }
  return value as PaperBase
}

function parseTone(value: unknown): PaperTone {
  if (
    typeof value !== 'string' ||
    !(paperTones as readonly string[]).includes(value)
  ) {
    throw new Error(`Tone must be one of: ${paperTones.join(', ')}`)
  }
  return value as PaperTone
}

function parseContrast(value: unknown): PaperContrast {
  if (
    typeof value !== 'string' ||
    !(paperContrasts as readonly string[]).includes(value)
  ) {
    throw new Error(`Contrast must be one of: ${paperContrasts.join(', ')}`)
  }
  return value as PaperContrast
}

function parseGrade(value: unknown, contrast: PaperContrast): number | null {
  if (contrast === 'variable') return null
  const n = typeof value === 'string' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 5) {
    throw new Error('Grade must be an integer between 0 and 5')
  }
  return n
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
    .select({ value: max(paperStocks.sortOrder) })
    .from(paperStocks)
    .get()
  return (row?.value ?? -1) + 1
}

async function ensureCodeUnique(
  manufacturerId: number,
  code: string,
  excludeId?: number,
) {
  const existing = await db
    .select({ id: paperStocks.id })
    .from(paperStocks)
    .where(
      excludeId
        ? and(
            eq(paperStocks.manufacturerId, manufacturerId),
            eq(paperStocks.code, code),
            ne(paperStocks.id, excludeId),
          )
        : and(
            eq(paperStocks.manufacturerId, manufacturerId),
            eq(paperStocks.code, code),
          ),
    )
    .get()
  if (existing) {
    throw new Error(`Code "${code}" already exists for this manufacturer`)
  }
}

function joinStock(row: {
  stock: typeof paperStocks.$inferSelect
  manufacturer: typeof manufacturers.$inferSelect
}): PaperStockWithManufacturer {
  return {
    ...row.stock,
    manufacturer: {
      id: row.manufacturer.id,
      code: row.manufacturer.code,
      label: row.manufacturer.label,
    },
  }
}

export const listPaperStocks = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PaperStockWithManufacturer[]> => {
    const rows = await db
      .select({ stock: paperStocks, manufacturer: manufacturers })
      .from(paperStocks)
      .innerJoin(manufacturers, eq(paperStocks.manufacturerId, manufacturers.id))
      .where(isNull(paperStocks.archivedAt))
      .orderBy(asc(paperStocks.sortOrder), asc(paperStocks.label))
      .all()
    return rows.map(joinStock)
  },
)

export const listAllPaperStocks = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PaperStockWithManufacturer[]> => {
    const rows = await db
      .select({ stock: paperStocks, manufacturer: manufacturers })
      .from(paperStocks)
      .innerJoin(manufacturers, eq(paperStocks.manufacturerId, manufacturers.id))
      .orderBy(asc(paperStocks.sortOrder), asc(paperStocks.label))
      .all()
    return rows.map(joinStock)
  },
)

export const createPaperStock = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown): Omit<PaperStockFields, 'sortOrder'> & {
    sortOrder?: number
  } => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const input = raw as Record<string, unknown>
    const label = parseLabel(input.label)
    const code = parseCode(input.code, label)
    const manufacturerId = parseId(input.manufacturerId)
    const base = parseBase(input.base)
    const tone = parseTone(input.tone)
    const contrast = parseContrast(input.contrast)
    const grade = parseGrade(input.grade, contrast)
    const sortOrder =
      typeof input.sortOrder === 'number' && Number.isInteger(input.sortOrder)
        ? input.sortOrder
        : undefined
    return {
      label,
      code,
      manufacturerId,
      base,
      tone,
      contrast,
      grade,
      sortOrder,
    }
  })
  .handler(async ({ data }) => {
    await assertManufacturerExists(data.manufacturerId)
    await ensureCodeUnique(data.manufacturerId, data.code)
    const sortOrder = data.sortOrder ?? (await nextSortOrder())
    const [row] = await db
      .insert(paperStocks)
      .values({
        code: data.code,
        label: data.label,
        manufacturerId: data.manufacturerId,
        base: data.base,
        tone: data.tone,
        contrast: data.contrast,
        grade: data.grade,
        sortOrder,
      })
      .returning()
    return row
  })

export const updatePaperStock = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const input = raw as Record<string, unknown>
    const id = parseId(input.id)
    const patch: Partial<PaperStockFields> = {}
    if ('label' in input) patch.label = parseLabel(input.label)
    if ('code' in input) patch.code = parseCode(input.code, patch.label ?? '')
    if ('manufacturerId' in input) {
      patch.manufacturerId = parseId(input.manufacturerId)
    }
    if ('base' in input) patch.base = parseBase(input.base)
    if ('tone' in input) patch.tone = parseTone(input.tone)
    if ('contrast' in input) patch.contrast = parseContrast(input.contrast)
    if ('grade' in input || 'contrast' in input) {
      const contrast = patch.contrast
      if (contrast !== undefined) {
        patch.grade = parseGrade(input.grade, contrast)
      } else if ('grade' in input) {
        // grade being set without contrast change — require DB lookup to know contrast
        // defer to handler to resolve
        patch.grade = input.grade as number | null
      }
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
    if (data.patch.manufacturerId !== undefined) {
      await assertManufacturerExists(data.patch.manufacturerId)
    }

    const existing = await db
      .select({
        code: paperStocks.code,
        manufacturerId: paperStocks.manufacturerId,
        contrast: paperStocks.contrast,
      })
      .from(paperStocks)
      .where(eq(paperStocks.id, data.id))
      .get()
    if (!existing) throw new Error('Paper stock not found')

    // Resolve grade against the effective contrast when contrast wasn't in the
    // patch but grade was.
    if (data.patch.grade !== undefined && data.patch.contrast === undefined) {
      data.patch.grade = parseGrade(data.patch.grade, existing.contrast)
    }

    if (
      data.patch.code !== undefined ||
      data.patch.manufacturerId !== undefined
    ) {
      const finalCode = data.patch.code ?? existing.code
      const finalMfgId = data.patch.manufacturerId ?? existing.manufacturerId
      await ensureCodeUnique(finalMfgId, finalCode, data.id)
    }

    const [row] = await db
      .update(paperStocks)
      .set(data.patch)
      .where(eq(paperStocks.id, data.id))
      .returning()
    if (!row) throw new Error('Paper stock not found')
    return row
  })

export const archivePaperStock = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: id }) => {
    const [row] = await db
      .update(paperStocks)
      .set({ archivedAt: new Date() })
      .where(eq(paperStocks.id, id))
      .returning()
    if (!row) throw new Error('Paper stock not found')
    return row
  })

export const unarchivePaperStock = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: id }) => {
    const [row] = await db
      .update(paperStocks)
      .set({ archivedAt: null })
      .where(eq(paperStocks.id, id))
      .returning()
    if (!row) throw new Error('Paper stock not found')
    return row
  })
