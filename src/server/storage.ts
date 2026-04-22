import { createServerFn } from '@tanstack/react-start'
import fs from 'node:fs'
import { sql } from 'drizzle-orm'
import { databasePath, db } from '#/db/client'

export type StorageFile = {
  label: string
  path: string
  bytes: number | null
}

export type StorageTable = {
  name: string
  rowCount: number
}

export type StorageInfo = {
  database: {
    path: string
    journalMode: string
    pageCount: number
    pageSize: number
    freelistCount: number
  }
  files: StorageFile[]
  tables: StorageTable[]
}

function statBytes(p: string): number | null {
  try {
    return fs.statSync(p).size
  } catch {
    return null
  }
}

function pragmaNumber(key: string): number {
  const row = db.get<Record<string, unknown>>(sql.raw(`PRAGMA ${key}`))
  const value = row ? Object.values(row)[0] : 0
  return typeof value === 'number' ? value : Number(value ?? 0)
}

function pragmaString(key: string): string {
  const row = db.get<Record<string, unknown>>(sql.raw(`PRAGMA ${key}`))
  const value = row ? Object.values(row)[0] : ''
  return typeof value === 'string' ? value : String(value ?? '')
}

export type VacuumResult = {
  reclaimedBytes: number
}

export type CheckpointResult = {
  busy: number
  logPages: number
  checkpointedPages: number
}

export const vacuumDatabase = createServerFn({ method: 'POST' }).handler(
  async (): Promise<VacuumResult> => {
    const before = pragmaNumber('freelist_count') * pragmaNumber('page_size')
    db.run(sql`VACUUM`)
    const after = pragmaNumber('freelist_count') * pragmaNumber('page_size')
    return { reclaimedBytes: Math.max(0, before - after) }
  },
)

export const checkpointWal = createServerFn({ method: 'POST' }).handler(
  async (): Promise<CheckpointResult> => {
    const row = db.get<Record<string, unknown>>(
      sql.raw(`PRAGMA wal_checkpoint(TRUNCATE)`),
    )
    const values = row ? Object.values(row).map((v) => Number(v ?? 0)) : [0, 0, 0]
    return {
      busy: values[0] ?? 0,
      logPages: values[1] ?? 0,
      checkpointedPages: values[2] ?? 0,
    }
  },
)

export const getStorageInfo = createServerFn({ method: 'GET' }).handler(
  async (): Promise<StorageInfo> => {
    const walPath = `${databasePath}-wal`
    const shmPath = `${databasePath}-shm`

    const files: StorageFile[] = [
      { label: 'Main', path: databasePath, bytes: statBytes(databasePath) },
      { label: 'WAL', path: walPath, bytes: statBytes(walPath) },
      { label: 'SHM', path: shmPath, bytes: statBytes(shmPath) },
    ]

    const database = {
      path: databasePath,
      journalMode: pragmaString('journal_mode'),
      pageCount: pragmaNumber('page_count'),
      pageSize: pragmaNumber('page_size'),
      freelistCount: pragmaNumber('freelist_count'),
    }

    const tableRows = db.all<{ name: string }>(
      sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
    )

    const tables: StorageTable[] = tableRows.map((t) => {
      const quoted = `"${t.name.replace(/"/g, '""')}"`
      const row = db.get<{ c: number }>(
        sql.raw(`SELECT COUNT(*) as c FROM ${quoted}`),
      )
      return { name: t.name, rowCount: Number(row?.c ?? 0) }
    })

    return { database, files, tables }
  },
)
