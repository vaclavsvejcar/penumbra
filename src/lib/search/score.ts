import type { ScoredItem, SearchItem } from './types'

const WORD_BOUNDARY = /[\s·\-_/.]/

/**
 * Lightweight fuzzy scorer. Not trying to beat fzf; just good enough to rank
 * short entity labels and their kickers well.
 *
 * Boosts (in descending weight):
 *   - Prefix match on the full text
 *   - Word-boundary-aligned substring match
 *   - Any substring match
 *   - Subsequence match (all query chars appear in order)
 *
 * Returns null when the text does not match at all.
 */
export function fuzzyScore(query: string, text: string): number | null {
  if (!query) return 1
  const q = query.toLowerCase()
  const t = text.toLowerCase()

  if (t.startsWith(q)) return 10_000 - t.length

  const idx = t.indexOf(q)
  if (idx !== -1) {
    const boundary = idx > 0 && WORD_BOUNDARY.test(t[idx - 1]!)
    return (boundary ? 5_000 : 2_000) - t.length - idx
  }

  // subsequence
  let qi = 0
  let last = -1
  let score = 500
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      const gap = last < 0 ? 0 : i - last - 1
      score -= gap * 2
      if (i === 0 || WORD_BOUNDARY.test(t[i - 1]!)) score += 30
      last = i
      qi++
    }
  }
  if (qi < q.length) return null
  return Math.max(score, 1)
}

export function filterAndScore(
  items: ReadonlyArray<SearchItem>,
  query: string,
): ScoredItem[] {
  const q = query.trim()
  if (!q) return items.map((item) => ({ item, score: 0 }))

  const scored: ScoredItem[] = []
  for (const item of items) {
    const score = fuzzyScore(q, item.searchText)
    if (score !== null) scored.push({ item, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored
}
