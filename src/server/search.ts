import { createServerFn } from '@tanstack/react-start'
import { asc, desc, eq, isNull } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import { db } from '#/db/client'
import {
  customerTypes,
  customers,
  developers,
  filmStocks,
  frames,
  manufacturers,
  negatives,
  paperStocks,
} from '#/db/schema'
import {
  frameDisplayId,
  negativeDisplayId,
  paddedFrameNumber,
} from '#/lib/negative-id'
import type { SearchItem } from '#/lib/search/types'

const filmManufacturers = alias(manufacturers, 'film_manufacturers')
const devManufacturers = alias(manufacturers, 'dev_manufacturers')

function norm(...parts: Array<string | null | undefined | number>): string {
  return parts
    .filter((p): p is string | number => p !== null && p !== undefined && p !== '')
    .map((p) => String(p).toLowerCase())
    .join(' ')
}

export const listSearchIndex = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SearchItem[]> => {
    const [
      customerRows,
      customerTypeRows,
      manufacturerRows,
      filmRows,
      paperRows,
      developerRows,
      negativeRows,
      frameRows,
    ] = await Promise.all([
      db
        .select({ customer: customers, customerType: customerTypes })
        .from(customers)
        .innerJoin(
          customerTypes,
          eq(customers.customerTypeId, customerTypes.id),
        )
        .orderBy(asc(customers.name))
        .all(),
      db
        .select()
        .from(customerTypes)
        .where(isNull(customerTypes.archivedAt))
        .orderBy(asc(customerTypes.sortOrder), asc(customerTypes.label))
        .all(),
      db
        .select()
        .from(manufacturers)
        .where(isNull(manufacturers.archivedAt))
        .orderBy(asc(manufacturers.sortOrder), asc(manufacturers.label))
        .all(),
      db
        .select({ stock: filmStocks, manufacturer: manufacturers })
        .from(filmStocks)
        .innerJoin(manufacturers, eq(filmStocks.manufacturerId, manufacturers.id))
        .where(isNull(filmStocks.archivedAt))
        .orderBy(asc(filmStocks.sortOrder), asc(filmStocks.label))
        .all(),
      db
        .select({ stock: paperStocks, manufacturer: manufacturers })
        .from(paperStocks)
        .innerJoin(manufacturers, eq(paperStocks.manufacturerId, manufacturers.id))
        .where(isNull(paperStocks.archivedAt))
        .orderBy(asc(paperStocks.sortOrder), asc(paperStocks.label))
        .all(),
      db
        .select({ developer: developers, manufacturer: manufacturers })
        .from(developers)
        .innerJoin(manufacturers, eq(developers.manufacturerId, manufacturers.id))
        .where(isNull(developers.archivedAt))
        .orderBy(asc(developers.sortOrder), asc(developers.label))
        .all(),
      db
        .select({
          negative: negatives,
          filmStock: filmStocks,
          filmManufacturer: filmManufacturers,
          developer: developers,
          devManufacturer: devManufacturers,
        })
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
        .where(isNull(negatives.archivedAt))
        .orderBy(desc(negatives.seqGlobal))
        .all(),
      db
        .select({ frame: frames, negative: negatives })
        .from(frames)
        .innerJoin(negatives, eq(frames.negativeId, negatives.id))
        .where(isNull(negatives.archivedAt))
        .orderBy(desc(negatives.seqGlobal), asc(frames.frameNumber))
        .all(),
    ])

    const items: SearchItem[] = []

    for (const row of customerRows) {
      const c = row.customer
      const t = row.customerType
      const cityOrType = c.city ?? t.label
      items.push({
        type: 'customer',
        id: c.id,
        title: c.name,
        kicker: `N° ${String(c.id).padStart(4, '0')}`,
        subtitle: cityOrType,
        searchText: norm(
          c.name,
          c.email,
          c.phone,
          c.city,
          c.notes,
          t.label,
          t.code,
        ),
        data: {
          ...c,
          customerType: { id: t.id, code: t.code, label: t.label },
        },
      })
    }

    for (const t of customerTypeRows) {
      items.push({
        type: 'customer-type',
        id: t.id,
        title: t.label,
        kicker: `N° ${String(t.id).padStart(4, '0')}`,
        searchText: norm(t.label, t.code),
        data: t,
      })
    }

    for (const m of manufacturerRows) {
      items.push({
        type: 'manufacturer',
        id: m.id,
        title: m.label,
        kicker: `N° ${String(m.id).padStart(4, '0')}`,
        searchText: norm(m.label, m.code),
        data: m,
      })
    }

    for (const row of filmRows) {
      const s = row.stock
      const m = row.manufacturer
      items.push({
        type: 'film-stock',
        id: s.id,
        title: `${m.label} ${s.label}`,
        kicker: `N° ${String(s.id).padStart(4, '0')}`,
        subtitle: `ISO ${s.iso} · ${s.type.toUpperCase()} · ${s.process.toUpperCase()}`,
        searchText: norm(
          m.label,
          m.code,
          s.label,
          s.code,
          `iso${s.iso}`,
          s.type,
          s.process,
        ),
        data: {
          ...s,
          manufacturer: { id: m.id, code: m.code, label: m.label },
        },
      })
    }

    for (const row of paperRows) {
      const s = row.stock
      const m = row.manufacturer
      const grade = s.grade !== null ? ` · G${s.grade}` : ''
      items.push({
        type: 'paper-stock',
        id: s.id,
        title: `${m.label} ${s.label}`,
        kicker: `N° ${String(s.id).padStart(4, '0')}`,
        subtitle: `${s.base.toUpperCase()} · ${s.tone} · ${s.contrast}${grade}`,
        searchText: norm(
          m.label,
          m.code,
          s.label,
          s.code,
          s.base,
          s.tone,
          s.contrast,
          s.grade,
        ),
        data: {
          ...s,
          manufacturer: { id: m.id, code: m.code, label: m.label },
        },
      })
    }

    for (const row of developerRows) {
      const d = row.developer
      const m = row.manufacturer
      items.push({
        type: 'developer',
        id: d.id,
        title: `${m.label} ${d.label}`,
        kicker: `N° ${String(d.id).padStart(4, '0')}`,
        subtitle: `${d.appliesTo} · ${d.form}`,
        searchText: norm(
          m.label,
          m.code,
          d.label,
          d.code,
          d.appliesTo,
          d.form,
        ),
        data: {
          ...d,
          manufacturer: { id: m.id, code: m.code, label: m.label },
        },
      })
    }

    for (const row of negativeRows) {
      const n = row.negative
      const fs = row.filmStock
      const fm = row.filmManufacturer
      const d = row.developer
      const dm = row.devManufacturer
      const display = negativeDisplayId(n)
      items.push({
        type: 'negative',
        id: n.id,
        title: display,
        kicker: 'Roll',
        subtitle: `${fm.label} ${fs.label} · ISO ${fs.iso}`,
        searchText: norm(
          display,
          String(n.seqGlobal),
          `${n.year}`,
          fm.label,
          fm.code,
          fs.label,
          fs.code,
          d?.label,
          d?.code,
          dm?.label,
          n.devNotes,
        ),
        data: {
          id: n.id,
          seqGlobal: n.seqGlobal,
          year: n.year,
          seqYear: n.seqYear,
          developedAt: n.developedAt,
          archivedAt: n.archivedAt,
          devNotes: n.devNotes,
          filmStock: {
            id: fs.id,
            code: fs.code,
            label: fs.label,
            iso: fs.iso,
            type: fs.type,
            process: fs.process,
            manufacturer: { id: fm.id, code: fm.code, label: fm.label },
          },
          developer:
            d && dm
              ? {
                  id: d.id,
                  code: d.code,
                  label: d.label,
                  manufacturer: { id: dm.id, code: dm.code, label: dm.label },
                }
              : null,
        },
      })
    }

    for (const row of frameRows) {
      const f = row.frame
      const n = row.negative
      const display = frameDisplayId(n, f)
      const title = f.subject ?? `Frame ${paddedFrameNumber(f)}`
      items.push({
        type: 'frame',
        id: f.id,
        title,
        kicker: display,
        subtitle: f.keeper ? 'Keeper' : undefined,
        searchText: norm(
          display,
          `frame${f.frameNumber}`,
          f.subject,
          f.notes,
          negativeDisplayId(n),
          f.keeper ? 'keeper' : null,
        ),
        data: {
          id: f.id,
          frameNumber: f.frameNumber,
          subject: f.subject,
          dateShot: f.dateShot,
          keeper: f.keeper,
          notes: f.notes,
          negative: {
            id: n.id,
            seqGlobal: n.seqGlobal,
            year: n.year,
            seqYear: n.seqYear,
          },
        },
      })
    }

    return items
  },
)
