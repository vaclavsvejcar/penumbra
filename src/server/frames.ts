import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, ne } from 'drizzle-orm'
import { db } from '#/db/client'
import { frames, negatives, type Frame } from '#/db/schema'

const MIN_FRAME = 1
const MAX_FRAME = 36

function parseId(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isInteger(n) || n <= 0) {
    throw new Error('Invalid id')
  }
  return n
}

function parseFrameNumber(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isInteger(n)) {
    throw new Error('Frame number must be a whole number')
  }
  if (n < MIN_FRAME || n > MAX_FRAME) {
    throw new Error(`Frame number must be between ${MIN_FRAME} and ${MAX_FRAME}`)
  }
  return n
}

function parseNullableText(value: unknown, label: string): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') throw new Error(`Invalid ${label}`)
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function parseOptionalDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error('Invalid date')
    return value
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) return null
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      throw new Error('Date must be YYYY-MM-DD')
    }
    const d = new Date(`${trimmed}T00:00:00.000Z`)
    if (Number.isNaN(d.getTime())) throw new Error('Invalid date')
    return d
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value)
  }
  throw new Error('Invalid date')
}

function parseKeeper(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (value === undefined || value === null) return false
  throw new Error('Keeper must be a boolean')
}

async function assertNegativeExists(id: number) {
  const row = await db
    .select({ id: negatives.id, archivedAt: negatives.archivedAt })
    .from(negatives)
    .where(eq(negatives.id, id))
    .get()
  if (!row) throw new Error('Negative not found')
  if (row.archivedAt) throw new Error('Negative is archived')
}

async function ensureFrameNumberFree(
  negativeId: number,
  frameNumber: number,
  excludeId?: number,
) {
  const conditions = excludeId
    ? and(
        eq(frames.negativeId, negativeId),
        eq(frames.frameNumber, frameNumber),
        ne(frames.id, excludeId),
      )
    : and(
        eq(frames.negativeId, negativeId),
        eq(frames.frameNumber, frameNumber),
      )
  const existing = await db
    .select({ id: frames.id })
    .from(frames)
    .where(conditions)
    .get()
  if (existing) {
    throw new Error(
      `Frame ${String(frameNumber).padStart(2, '0')} already exists on this roll`,
    )
  }
}

export const listFrames = createServerFn({ method: 'GET' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: negativeId }): Promise<Frame[]> => {
    return db
      .select()
      .from(frames)
      .where(eq(frames.negativeId, negativeId))
      .orderBy(asc(frames.frameNumber))
      .all()
  })

type CreateInput = {
  negativeId: number
  frameNumber: number
  subject: string | null
  dateShot: Date | null
  keeper: boolean
  notes: string | null
}

export const createFrame = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown): CreateInput => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const input = raw as Record<string, unknown>
    return {
      negativeId: parseId(input.negativeId),
      frameNumber: parseFrameNumber(input.frameNumber),
      subject: parseNullableText(input.subject, 'subject'),
      dateShot: parseOptionalDate(input.dateShot),
      keeper: parseKeeper(input.keeper),
      notes: parseNullableText(input.notes, 'notes'),
    }
  })
  .handler(async ({ data }) => {
    await assertNegativeExists(data.negativeId)
    await ensureFrameNumberFree(data.negativeId, data.frameNumber)
    const [row] = await db.insert(frames).values(data).returning()
    return row
  })

type UpdateInput = {
  frameNumber?: number
  subject?: string | null
  dateShot?: Date | null
  keeper?: boolean
  notes?: string | null
}

export const updateFrame = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid payload')
    const input = raw as Record<string, unknown>
    const id = parseId(input.id)
    const patch: UpdateInput = {}
    if ('frameNumber' in input) {
      patch.frameNumber = parseFrameNumber(input.frameNumber)
    }
    if ('subject' in input) {
      patch.subject = parseNullableText(input.subject, 'subject')
    }
    if ('dateShot' in input) patch.dateShot = parseOptionalDate(input.dateShot)
    if ('keeper' in input) patch.keeper = parseKeeper(input.keeper)
    if ('notes' in input) patch.notes = parseNullableText(input.notes, 'notes')
    if (Object.keys(patch).length === 0) throw new Error('Nothing to update')
    return { id, patch }
  })
  .handler(async ({ data }) => {
    if (data.patch.frameNumber !== undefined) {
      const existing = await db
        .select({ negativeId: frames.negativeId })
        .from(frames)
        .where(eq(frames.id, data.id))
        .get()
      if (!existing) throw new Error('Frame not found')
      await ensureFrameNumberFree(
        existing.negativeId,
        data.patch.frameNumber,
        data.id,
      )
    }
    const [row] = await db
      .update(frames)
      .set(data.patch)
      .where(eq(frames.id, data.id))
      .returning()
    if (!row) throw new Error('Frame not found')
    return row
  })

export const deleteFrame = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => parseId(raw))
  .handler(async ({ data: id }) => {
    const [row] = await db
      .delete(frames)
      .where(eq(frames.id, id))
      .returning()
    if (!row) throw new Error('Frame not found')
    return row
  })
