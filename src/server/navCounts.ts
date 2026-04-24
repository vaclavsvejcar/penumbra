import { createServerFn } from '@tanstack/react-start'
import { sql } from 'drizzle-orm'
import { db } from '#/db/client'
import { customers, negatives } from '#/db/schema'

export type NavCounts = {
  negatives: number
  customers: number
}

export const getNavCounts = createServerFn({ method: 'GET' }).handler(
  async (): Promise<NavCounts> => {
    const negRow = await db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(negatives)
      .get()
    const custRow = await db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(customers)
      .get()
    return {
      negatives: negRow?.n ?? 0,
      customers: custRow?.n ?? 0,
    }
  },
)
