import { useRouter } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'

type ArchivableRow = {
  id: number
  archivedAt: Date | null
}

type ServerFn = (opts: { data: number }) => Promise<unknown>

type UseLookupAdminOptions<T extends ArchivableRow> = {
  rows: T[]
  matchesQuery: (row: T, q: string) => boolean
  archiveFn: ServerFn
  unarchiveFn: ServerFn
}

/**
 * Shared state + handlers for a lookup admin page. Keeps creating/editing/busy/
 * error/query state, archive callbacks, and the default filter behaviour:
 * empty query hides archived rows; a non-empty query searches across everything
 * returned by matchesQuery (archived included).
 */
export function useLookupAdmin<T extends ArchivableRow>(
  options: UseLookupAdminOptions<T>,
) {
  const { rows, matchesQuery, archiveFn, unarchiveFn } = options
  const router = useRouter()

  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q) return rows.filter((r) => matchesQuery(r, q))
    return rows.filter((r) => r.archivedAt === null)
  }, [rows, query, matchesQuery])

  const runAction = useCallback(
    async (fn: () => Promise<unknown>, fallbackMessage: string) => {
      setBusy(true)
      setError(null)
      try {
        await fn()
        await router.invalidate()
      } catch (err) {
        setError(err instanceof Error ? err.message : fallbackMessage)
      } finally {
        setBusy(false)
      }
    },
    [router],
  )

  const handleArchive = useCallback(
    (id: number) => runAction(() => archiveFn({ data: id }), 'Archive failed.'),
    [archiveFn, runAction],
  )

  const handleUnarchive = useCallback(
    (id: number) =>
      runAction(() => unarchiveFn({ data: id }), 'Restore failed.'),
    [unarchiveFn, runAction],
  )

  const startCreating = useCallback(() => {
    setCreating(true)
    setEditingId(null)
  }, [])

  const startEditing = useCallback((id: number) => {
    setEditingId(id)
    setCreating(false)
  }, [])

  const cancelCreating = useCallback(() => setCreating(false), [])
  const cancelEditing = useCallback(() => setEditingId(null), [])

  const reloadAfterSave = useCallback(async () => {
    setCreating(false)
    setEditingId(null)
    await router.invalidate()
  }, [router])

  const clearQuery = useCallback(() => setQuery(''), [])

  return {
    creating,
    editingId,
    busy,
    error,
    query,
    filtered,
    setQuery,
    clearQuery,
    setError,
    startCreating,
    startEditing,
    cancelCreating,
    cancelEditing,
    handleArchive,
    handleUnarchive,
    reloadAfterSave,
  }
}
