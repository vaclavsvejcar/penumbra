import type { RecentRef, SearchItem, SearchItemType } from './types'

const KEY = 'penumbra.search.recent'
const MAX = 8

function read(): RecentRef[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (r): r is RecentRef =>
        r &&
        typeof r === 'object' &&
        typeof r.type === 'string' &&
        (typeof r.id === 'number' || typeof r.id === 'string'),
    )
  } catch {
    return []
  }
}

function write(refs: RecentRef[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(refs.slice(0, MAX)))
  } catch {
    // quota / disabled storage — silent
  }
}

export function getRecentRefs(): RecentRef[] {
  return read()
}

export function pushRecent(type: SearchItemType, id: SearchItem['id']) {
  const existing = read().filter((r) => !(r.type === type && r.id === id))
  write([{ type, id }, ...existing])
}

export function resolveRecents(
  refs: ReadonlyArray<RecentRef>,
  items: ReadonlyArray<SearchItem>,
): SearchItem[] {
  const index = new Map<string, SearchItem>()
  for (const item of items) index.set(`${item.type}:${item.id}`, item)
  const out: SearchItem[] = []
  for (const ref of refs) {
    const found = index.get(`${ref.type}:${ref.id}`)
    if (found) out.push(found)
  }
  return out
}
