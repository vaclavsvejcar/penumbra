export type FocusSearch = { focus?: number }

/**
 * Route validateSearch for lookup pages. Accepts `?focus=<id>` (number or
 * numeric string) and drops anything else. Used by the search palette to land
 * on a specific row.
 */
export function parseFocusSearch(search: Record<string, unknown>): FocusSearch {
  const raw = search.focus
  const n =
    typeof raw === 'string' ? Number(raw) : typeof raw === 'number' ? raw : NaN
  return Number.isInteger(n) && n > 0 ? { focus: n } : {}
}
