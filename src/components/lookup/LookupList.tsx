import { useEffect, useRef, useState } from 'react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

type Row = {
  id: number
}

type LookupListProps<T extends Row> = {
  rows: T[]
  totalRows: number
  query: string
  onClearQuery: () => void
  creating: boolean
  editingId: number | null
  emptyMessage: string
  renderNewRow: () => React.ReactNode
  renderEditRow: (row: T) => React.ReactNode
  renderDisplayRow: (row: T) => React.ReactNode
  /**
   * When set, the row with this id is scrolled into view on mount and
   * briefly highlighted with a safelight tint. Used by the search palette
   * to land on the exact record the user picked.
   */
  focusId?: number
}

/**
 * Renders the shared <ul> shell for a lookup admin: the optional creating row
 * at the top, empty/no-match states when the filtered list is empty, and the
 * display/edit branch for each remaining row. Callers own the inner row
 * contents via the three render props.
 */
export function LookupList<T extends Row>({
  rows,
  totalRows,
  query,
  onClearQuery,
  creating,
  editingId,
  emptyMessage,
  renderNewRow,
  renderEditRow,
  renderDisplayRow,
  focusId,
}: LookupListProps<T>) {
  const trimmedQuery = query.trim()
  const showEmpty = totalRows === 0 && !creating
  const showNoMatches = !showEmpty && rows.length === 0 && !creating

  const focusRef = useRef<HTMLLIElement>(null)
  const [isGlowing, setIsGlowing] = useState(false)

  useEffect(() => {
    if (!focusId) {
      setIsGlowing(false)
      return
    }
    const exists = rows.some((r) => r.id === focusId)
    if (!exists) return
    setIsGlowing(true)
    // Scroll on next paint so the ref is mounted.
    const raf = requestAnimationFrame(() => {
      focusRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
    const timer = setTimeout(() => setIsGlowing(false), 1800)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [focusId, rows])

  return (
    <ul>
      {creating ? (
        <li className="border-hairline bg-muted/20 border-b">
          {renderNewRow()}
        </li>
      ) : null}

      {showEmpty ? (
        <li className="border-hairline border-b py-12 text-center">
          <p className="kicker text-ink-muted mb-1">Empty list</p>
          <p className="text-ink-soft font-serif italic">{emptyMessage}</p>
        </li>
      ) : null}

      {showNoMatches ? (
        <li className="border-hairline border-b py-12 text-center">
          <p className="kicker text-ink-muted mb-1">No matches</p>
          <p className="text-ink-soft font-serif italic">
            Nothing found for “{trimmedQuery}”.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearQuery}
            className="mt-3"
          >
            Clear search
          </Button>
        </li>
      ) : null}

      {rows.map((row) => {
        const isFocused = focusId === row.id && isGlowing
        const commonClass = cn(
          'border-hairline border-b transition-colors duration-700',
          isFocused && 'bg-safelight-soft',
        )
        if (editingId === row.id) {
          return (
            <li
              key={row.id}
              ref={focusId === row.id ? focusRef : undefined}
              className={cn(commonClass, 'bg-muted/20')}
            >
              {renderEditRow(row)}
            </li>
          )
        }
        return (
          <li
            key={row.id}
            ref={focusId === row.id ? focusRef : undefined}
            className={commonClass}
          >
            {renderDisplayRow(row)}
          </li>
        )
      })}
    </ul>
  )
}
