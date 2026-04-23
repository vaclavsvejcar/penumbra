import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, isNull, max, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import { db } from '#/db/client'
import {
  developers,
  filmStocks,
  frames,
  manufacturers,
  negatives,
  type NegativeWithRefs,
} from '#/db/schema'

const filmManufacturers = alias(manufacturers, 'film_manufacturers')
const devManufacturers = alias(manufacturers, 'dev_manufacturers')

function parseId(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isInteger(n) || n <= 0) {
    throw new Error('Invalid id')
  }
  return n
}

function parseOptionalId(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  return parseId(value)
}

function parseOptionalPositiveInt(
  value: unknown,
  label: string,
): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const n = typeof value === 'string' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isInteger(n) || n <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
  return n
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0')
}

function parseDate(value: unknown): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error('Invalid date')
    return value
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      throw new Error('Date must be YYYY-MM-DD')
    }
    const d = new Date(`${trimmed}T00:00:00.000Z`)
    if (Number.isNaN(d.getTime())) throw new Error('Invalid date')
    return d
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) throw new Error('Invalid date')
    return d
  }
  throw new Error('Invalid date')
}

function parseNullableText(value: unknown, label: string): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') throw new Error(`Invalid ${label}`)
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

async function assertFilmStockExists(id: number) {
  const row = await db
    .select({ id: filmStocks.id, archivedAt: filmStocks.archivedAt })
    .from(filmStocks)
    .where(eq(filmStocks.id, id))
    .get()
  if (!row) throw new Error('Film stock not found')
  if (row.archivedAt) throw new Error('Film stock is archived')
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

type RawSelectRow = {
  negative: typeof negatives.$inferSelect
  filmStock: typeof filmStocks.$inferSelect
  filmManufacturer: typeof manufacturers.$inferSelect
  developer: typeof developers.$inferSelect | null
  devManufacturer: typeof manufacturers.$inferSelect | null
  frameCount: number
  keeperCount: number
}

function joinNegative(row: RawSelectRow): NegativeWithRefs {
  return {
    ...row.negative,
    filmStock: {
      id: row.filmStock.id,
      code: row.filmStock.code,
      label: row.filmStock.label,
      iso: row.filmStock.iso,
      type: row.filmStock.type,
      process: row.filmStock.process,
      manufacturer: {
        id: row.filmManufacturer.id,
        code: row.filmManufacturer.code,
        label: row.filmManufacturer.label,
      },
    },
    developer:
      row.developer && row.devManufacturer
        ? {
            id: row.developer.id,
            code: row.developer.code,
            label: row.developer.label,
            manufacturer: {
              id: row.devManufacturer.id,
              code: row.devManufacturer.code,
              label: row.devManufacturer.label,
            },
          }
        : null,
    frameCount: Number(row.frameCount ?? 0),
    keeperCount: Number(row.keeperCount ?? 0),
  }
}

const baseSelect = {
  negative: negatives,
  filmStock: filmStocks,
  filmManufacturer: filmManufacturers,
  developer: developers,
  devManufacturer: devManufacturers,
  frameCount:
    sql<number>`(SELECT count(*) FROM ${frames} WHERE ${frames.negativeId} = ${negatives.id})`.as(
      'frame_count',
    ),
  keeperCount:
    sql<number>`(SELECT count(*) FROM ${frames} WHERE ${frames.negativeId} = ${negatives.id} AND ${frames.keeper} = 1)`.as(
      'keeper_count',
    ),
}

function baseQuery() {
  return db
    .select(baseSelect)
    .from(negatives)
    .innerJoin(filmStocks, eq(negatives.filmStockId, filmStocks.id))
    .innerJoin(
      filmManufacturers,
      eq(filmStocks.manufacturerId, filmManufacturers.id),
    )
    .leftJoin(developers, eq(negatives.developerId, developers.id))
    .leftJoin(
      devManufacturers,
      eq(developers.manufacturerId, devManufacturers.id),
    )
}

export const listNegatives = createServerFn({ method: 'GET' }).handler(
  async (): Promise<NegativeWithRefs[]> => {
    const rows = await baseQuery()
      .where(isNull(negatives.archivedAt))
      .orderBy(desc(negatives.seqGlobal))
      .all()
    return rows.map((r) => joinNegative(r as RawSelectRow))
  },
)

export const listAllNegatives = createServerFn({ method: 'GET' }).handler(
  async (): Promise<NegativeWithRefs[]> => {
    const rows = await baseQuery().orderBy(desc(negatives.seqGlobal)).all()
    return rows.map((r) => joinNegative(r as RawSelectRow))
  },
)

export const getNegative = createServerFn({ method: 'GET' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: id }): Promise<NegativeWithRefs | null> => {
    const row = await baseQuery().where(eq(negatives.id, id)).get()
    return row ? joinNegative(row as RawSelectRow) : null
  })

type CreateInput = {
  filmStockId: number
  developerId: number | null
  developedAt: Date
  devNotes: string | null
  seqGlobal?: number
  seqYear?: number
}

export const nextNegativeSequences = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ global: number; byYear: Record<number, number> }> => {
    const [globalRow, yearRows] = await Promise.all([
      db.select({ value: max(negatives.seqGlobal) }).from(negatives).get(),
      db
        .select({ year: negatives.year, value: max(negatives.seqYear) })
        .from(negatives)
        .groupBy(negatives.year)
        .all(),
    ])
    const byYear: Record<number, number> = {}
    for (const r of yearRows) {
      if (r.value !== null) byYear[r.year] = r.value + 1
    }
    return { global: (globalRow?.value ?? 0) + 1, byYear }
  },
)

export const createNegative = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown): CreateInput => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const input = raw as Record<string, unknown>
    return {
      filmStockId: parseId(input.filmStockId),
      developerId: parseOptionalId(input.developerId),
      developedAt: parseDate(input.developedAt),
      devNotes: parseNullableText(input.devNotes, 'notes'),
      seqGlobal: parseOptionalPositiveInt(input.seqGlobal, 'Global №'),
      seqYear: parseOptionalPositiveInt(input.seqYear, 'Year №'),
    }
  })
  .handler(async ({ data }) => {
    await assertFilmStockExists(data.filmStockId)
    if (data.developerId !== null) {
      await assertDeveloperExists(data.developerId)
    }
    const year = data.developedAt.getUTCFullYear()
    return db.transaction((tx) => {
      let seqGlobal: number
      if (data.seqGlobal !== undefined) {
        const conflict = tx
          .select({ id: negatives.id })
          .from(negatives)
          .where(eq(negatives.seqGlobal, data.seqGlobal))
          .get()
        if (conflict) {
          throw new Error(`Global № ${pad(data.seqGlobal, 4)} is already used`)
        }
        seqGlobal = data.seqGlobal
      } else {
        const globalRow = tx
          .select({ value: max(negatives.seqGlobal) })
          .from(negatives)
          .get()
        seqGlobal = (globalRow?.value ?? 0) + 1
      }

      let seqYear: number
      if (data.seqYear !== undefined) {
        const conflict = tx
          .select({ id: negatives.id })
          .from(negatives)
          .where(
            and(eq(negatives.year, year), eq(negatives.seqYear, data.seqYear)),
          )
          .get()
        if (conflict) {
          throw new Error(
            `Year № ${year}-${pad(data.seqYear, 3)} is already used`,
          )
        }
        seqYear = data.seqYear
      } else {
        const yearRow = tx
          .select({ value: max(negatives.seqYear) })
          .from(negatives)
          .where(eq(negatives.year, year))
          .get()
        seqYear = (yearRow?.value ?? 0) + 1
      }

      const inserted = tx
        .insert(negatives)
        .values({
          seqGlobal,
          year,
          seqYear,
          filmStockId: data.filmStockId,
          developerId: data.developerId,
          developedAt: data.developedAt,
          devNotes: data.devNotes,
        })
        .returning()
        .all()
      return inserted[0]
    })
  })

type UpdateInput = {
  filmStockId?: number
  developerId?: number | null
  developedAt?: Date
  devNotes?: string | null
}

export const updateNegative = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const input = raw as Record<string, unknown>
    const id = parseId(input.id)
    const patch: UpdateInput = {}
    if ('filmStockId' in input) patch.filmStockId = parseId(input.filmStockId)
    if ('developerId' in input) {
      patch.developerId = parseOptionalId(input.developerId)
    }
    if ('developedAt' in input) patch.developedAt = parseDate(input.developedAt)
    if ('devNotes' in input) {
      patch.devNotes = parseNullableText(input.devNotes, 'notes')
    }
    if (Object.keys(patch).length === 0) throw new Error('Nothing to update')
    return { id, patch }
  })
  .handler(async ({ data }) => {
    if (data.patch.filmStockId !== undefined) {
      await assertFilmStockExists(data.patch.filmStockId)
    }
    if (
      data.patch.developerId !== undefined &&
      data.patch.developerId !== null
    ) {
      await assertDeveloperExists(data.patch.developerId)
    }
    if (data.patch.developedAt !== undefined) {
      const existing = await db
        .select({ year: negatives.year })
        .from(negatives)
        .where(eq(negatives.id, data.id))
        .get()
      if (!existing) throw new Error('Negative not found')
      const newYear = data.patch.developedAt.getUTCFullYear()
      if (newYear !== existing.year) {
        throw new Error(
          `Developed year (${newYear}) cannot differ from assigned year (${existing.year}). Archive and create a new entry instead.`,
        )
      }
    }
    const [row] = await db
      .update(negatives)
      .set(data.patch)
      .where(eq(negatives.id, data.id))
      .returning()
    if (!row) throw new Error('Negative not found')
    return row
  })

export const archiveNegative = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: id }) => {
    const [row] = await db
      .update(negatives)
      .set({ archivedAt: new Date() })
      .where(eq(negatives.id, id))
      .returning()
    if (!row) throw new Error('Negative not found')
    return row
  })

export const unarchiveNegative = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: id }) => {
    const [row] = await db
      .update(negatives)
      .set({ archivedAt: null })
      .where(eq(negatives.id, id))
      .returning()
    if (!row) throw new Error('Negative not found')
    return row
  })
