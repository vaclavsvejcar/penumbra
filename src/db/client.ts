import Database from 'better-sqlite3'
import path from 'node:path'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

export const databasePath = path.resolve(
  process.env.DATABASE_URL ?? './penumbra.db',
)

const sqlite = new Database(databasePath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })
export type DB = typeof db
