import { Button } from '#/components/ui/button'

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
}: LookupListProps<T>) {
  const trimmedQuery = query.trim()
  const showEmpty = totalRows === 0 && !creating
  const showNoMatches = !showEmpty && rows.length === 0 && !creating

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

      {rows.map((row) =>
        editingId === row.id ? (
          <li key={row.id} className="border-hairline bg-muted/20 border-b">
            {renderEditRow(row)}
          </li>
        ) : (
          <li key={row.id} className="border-hairline border-b">
            {renderDisplayRow(row)}
          </li>
        ),
      )}
    </ul>
  )
}
