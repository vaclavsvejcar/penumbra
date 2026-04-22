import { createServerFn } from '@tanstack/react-start'
import { asc, eq, isNull } from 'drizzle-orm'
import { db } from '#/db/client'
import {
  customerTypes,
  customers,
  developers,
  filmStocks,
  manufacturers,
  paperStocks,
} from '#/db/schema'
import type { SearchItem } from '#/lib/search/types'

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
        kicker: `CUST · ${String(c.id).padStart(3, '0')}`,
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
        kicker: `TYPE · ${t.code}`,
        searchText: norm(t.label, t.code),
        data: t,
      })
    }

    for (const m of manufacturerRows) {
      items.push({
        type: 'manufacturer',
        id: m.id,
        title: m.label,
        kicker: `MFR · ${m.code}`,
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
        kicker: `FILM · ${s.code}`,
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
        kicker: `PAPER · ${s.code}`,
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
        kicker: `DEV · ${d.code}`,
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

    return items
  },
)
