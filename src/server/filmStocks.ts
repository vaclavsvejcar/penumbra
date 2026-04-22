import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, isNull, max, ne } from 'drizzle-orm'
import { db } from '#/db/client'
import {
  filmProcesses,
  filmStocks,
  filmTypes,
  manufacturers,
  type FilmProcess,
  type FilmStockWithManufacturer,
  type FilmType,
} from '#/db/schema'
import { slugify } from '#/lib/slug'

type FilmStockFields = {
  code: string
  label: string
  manufacturerId: number
  iso: number
  type: FilmType
  process: FilmProcess
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

function parseIso(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isInteger(n) || n <= 0 || n > 100000) {
    throw new Error('ISO must be a positive integer')
  }
  return n
}

function parseType(value: unknown): FilmType {
  if (
    typeof value !== 'string' ||
    !(filmTypes as readonly string[]).includes(value)
  ) {
    throw new Error(`Type must be one of: ${filmTypes.join(', ')}`)
  }
  return value as FilmType
}

function parseProcess(value: unknown): FilmProcess {
  if (
    typeof value !== 'string' ||
    !(filmProcesses as readonly string[]).includes(value)
  ) {
    throw new Error(`Process must be one of: ${filmProcesses.join(', ')}`)
  }
  return value as FilmProcess
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
    .select({ value: max(filmStocks.sortOrder) })
    .from(filmStocks)
    .get()
  return (row?.value ?? -1) + 1
}

async function ensureCodeUnique(
  manufacturerId: number,
  code: string,
  excludeId?: number,
) {
  const existing = await db
    .select({ id: filmStocks.id })
    .from(filmStocks)
    .where(
      excludeId
        ? and(
            eq(filmStocks.manufacturerId, manufacturerId),
            eq(filmStocks.code, code),
            ne(filmStocks.id, excludeId),
          )
        : and(
            eq(filmStocks.manufacturerId, manufacturerId),
            eq(filmStocks.code, code),
          ),
    )
    .get()
  if (existing) {
    throw new Error(`Code "${code}" already exists for this manufacturer`)
  }
}

function joinStock(row: {
  stock: typeof filmStocks.$inferSelect
  manufacturer: typeof manufacturers.$inferSelect
}): FilmStockWithManufacturer {
  return {
    ...row.stock,
    manufacturer: {
      id: row.manufacturer.id,
      code: row.manufacturer.code,
      label: row.manufacturer.label,
    },
  }
}

export const listFilmStocks = createServerFn({ method: 'GET' }).handler(
  async (): Promise<FilmStockWithManufacturer[]> => {
    const rows = await db
      .select({ stock: filmStocks, manufacturer: manufacturers })
      .from(filmStocks)
      .innerJoin(manufacturers, eq(filmStocks.manufacturerId, manufacturers.id))
      .where(isNull(filmStocks.archivedAt))
      .orderBy(asc(filmStocks.sortOrder), asc(filmStocks.label))
      .all()
    return rows.map(joinStock)
  },
)

export const listAllFilmStocks = createServerFn({ method: 'GET' }).handler(
  async (): Promise<FilmStockWithManufacturer[]> => {
    const rows = await db
      .select({ stock: filmStocks, manufacturer: manufacturers })
      .from(filmStocks)
      .innerJoin(manufacturers, eq(filmStocks.manufacturerId, manufacturers.id))
      .orderBy(asc(filmStocks.sortOrder), asc(filmStocks.label))
      .all()
    return rows.map(joinStock)
  },
)

export const createFilmStock = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown): Omit<FilmStockFields, 'sortOrder'> & {
    sortOrder?: number
  } => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const input = raw as Record<string, unknown>
    const label = parseLabel(input.label)
    const code = parseCode(input.code, label)
    const manufacturerId = parseId(input.manufacturerId)
    const iso = parseIso(input.iso)
    const type = parseType(input.type)
    const process = parseProcess(input.process)
    const sortOrder =
      typeof input.sortOrder === 'number' && Number.isInteger(input.sortOrder)
        ? input.sortOrder
        : undefined
    return { label, code, manufacturerId, iso, type, process, sortOrder }
  })
  .handler(async ({ data }) => {
    await assertManufacturerExists(data.manufacturerId)
    await ensureCodeUnique(data.manufacturerId, data.code)
    const sortOrder = data.sortOrder ?? (await nextSortOrder())
    const [row] = await db
      .insert(filmStocks)
      .values({
        code: data.code,
        label: data.label,
        manufacturerId: data.manufacturerId,
        iso: data.iso,
        type: data.type,
        process: data.process,
        sortOrder,
      })
      .returning()
    return row
  })

export const updateFilmStock = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const input = raw as Record<string, unknown>
    const id = parseId(input.id)
    const patch: Partial<FilmStockFields> = {}
    if ('label' in input) patch.label = parseLabel(input.label)
    if ('code' in input) patch.code = parseCode(input.code, patch.label ?? '')
    if ('manufacturerId' in input) {
      patch.manufacturerId = parseId(input.manufacturerId)
    }
    if ('iso' in input) patch.iso = parseIso(input.iso)
    if ('type' in input) patch.type = parseType(input.type)
    if ('process' in input) patch.process = parseProcess(input.process)
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
          code: filmStocks.code,
          manufacturerId: filmStocks.manufacturerId,
        })
        .from(filmStocks)
        .where(eq(filmStocks.id, data.id))
        .get()
      if (!existing) throw new Error('Film stock not found')
      const finalCode = data.patch.code ?? existing.code
      const finalMfgId = data.patch.manufacturerId ?? existing.manufacturerId
      await ensureCodeUnique(finalMfgId, finalCode, data.id)
    }
    const [row] = await db
      .update(filmStocks)
      .set(data.patch)
      .where(eq(filmStocks.id, data.id))
      .returning()
    if (!row) throw new Error('Film stock not found')
    return row
  })

export const archiveFilmStock = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: id }) => {
    const [row] = await db
      .update(filmStocks)
      .set({ archivedAt: new Date() })
      .where(eq(filmStocks.id, id))
      .returning()
    if (!row) throw new Error('Film stock not found')
    return row
  })

export const unarchiveFilmStock = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: id }) => {
    const [row] = await db
      .update(filmStocks)
      .set({ archivedAt: null })
      .where(eq(filmStocks.id, id))
      .returning()
    if (!row) throw new Error('Film stock not found')
    return row
  })
