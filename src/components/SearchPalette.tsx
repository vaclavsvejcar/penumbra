import { Dialog as DialogPrimitive } from 'radix-ui'
import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '#/lib/utils'
import { filterAndScore } from '#/lib/search/score'
import { buildNavigationItems } from '#/lib/search/navigation'
import {
  parsePrompt,
  suggestScopes,
} from '#/lib/search/scope'
import {
  getRecentRefs,
  pushRecent,
  resolveRecents,
} from '#/lib/search/recent'
import {
  findScopeByCode,
  GROUP_ORDER,
  groupLabelFor,
} from '#/lib/search/registry'
import type {
  ScopeDef,
  SearchItem,
  SearchItemType,
} from '#/lib/search/types'
import { listSearchIndex } from '#/server/search'
import {
  type ResultsGroup,
  SearchResultsList,
  keyFor,
} from './search/SearchResultsList'
import { SearchPreviewPane } from './search/SearchPreviewPane'
import { SearchPrompt } from './search/SearchPrompt'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MAX_PER_GROUP = 6
const MAX_FLAT = 80

type NavTarget = { to: string; search: Record<string, string | number> }

function targetForItem(item: SearchItem): NavTarget {
  switch (item.type) {
    case 'navigation':
      return { to: item.data.href, search: {} }
    case 'customer':
      return { to: `/customers/${item.id}`, search: {} }
    case 'customer-type':
      return { to: '/lookups/customer-types', search: { focus: item.id } }
    case 'manufacturer':
      return { to: '/lookups/manufacturers', search: { focus: item.id } }
    case 'film-stock':
      return { to: '/lookups/film-stocks', search: { focus: item.id } }
    case 'paper-stock':
      return { to: '/lookups/paper-stocks', search: { focus: item.id } }
    case 'developer':
      return { to: '/lookups/developers', search: { focus: item.id } }
    case 'developer-dilution':
      return {
        to: '/lookups/developer-dilutions',
        search: { focus: item.id },
      }
    case 'negative':
      return { to: `/negatives/${item.id}`, search: {} }
    case 'frame':
      return {
        to: `/negatives/${item.data.negative.id}`,
        search: { focus: item.id },
      }
  }
}

function hrefForTarget(target: NavTarget): string {
  const keys = Object.keys(target.search)
  if (keys.length === 0) return target.to
  const params = new URLSearchParams()
  for (const k of keys) params.set(k, String(target.search[k]))
  return `${target.to}?${params.toString()}`
}

export function SearchPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const [index, setIndex] = useState<SearchItem[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [raw, setRaw] = useState('')
  const [scope, setScope] = useState<ScopeDef | null>(null)
  const [slashMode, setSlashMode] = useState(false)
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null)

  // Lazy-load the remote index on first open; reload on each subsequent open so
  // data stays fresh without hammering the server.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    listSearchIndex()
      .then((remote) => {
        if (cancelled) return
        const combined = [...buildNavigationItems(), ...remote]
        setIndex(combined)
        setLoadError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Unable to load index')
      })
    return () => {
      cancelled = true
    }
  }, [open])

  // Reset prompt whenever the palette closes.
  useEffect(() => {
    if (!open) {
      setRaw('')
      setScope(null)
      setSlashMode(false)
      setHighlightedKey(null)
    }
  }, [open])

  const parsed = useMemo(
    () => parsePrompt(raw, scope, slashMode),
    [raw, scope, slashMode],
  )

  // Materialise a scope when the parser detects `/code<space>…` from a paste.
  useEffect(() => {
    if (!scope && parsed.scope) {
      setScope(parsed.scope)
      setSlashMode(false)
      setRaw(parsed.query)
    }
  }, [parsed, scope])

  const groups = useMemo<ResultsGroup[]>(() => {
    if (!index) return []

    const effectiveQuery = parsed.query.trim()
    const scoped = scope
      ? index.filter((it) => it.type === scope.itemType)
      : index

    // Empty query + global → show Recents on top, then each group by first few.
    if (!effectiveQuery && !scope) {
      const out: ResultsGroup[] = []
      const recents = resolveRecents(getRecentRefs(), index)
      if (recents.length > 0) {
        out.push({
          key: 'recent',
          label: 'Recent',
          items: recents.slice(0, 6),
          total: recents.length,
        })
      }
      for (const type of GROUP_ORDER) {
        const all = index.filter((it) => it.type === type)
        if (all.length > 0) {
          out.push({
            key: type,
            label: groupLabelFor(type),
            items: all.slice(0, MAX_PER_GROUP),
            total: all.length,
          })
        }
      }
      return out
    }

    // Empty query + active scope → list everything in that scope (cap for sanity).
    if (!effectiveQuery && scope) {
      return [
        {
          key: scope.itemType,
          label: groupLabelFor(scope.itemType),
          items: scoped.slice(0, MAX_FLAT),
          total: scoped.length,
        },
      ]
    }

    const scored = filterAndScore(scoped, effectiveQuery).slice(0, MAX_FLAT)

    if (scope) {
      return [
        {
          key: scope.itemType,
          label: groupLabelFor(scope.itemType),
          items: scored.map((s) => s.item),
          total: scored.length,
        },
      ]
    }

    // Global filtered: count per type on full scored set, then cap display items.
    const totalByType = new Map<SearchItemType, number>()
    const itemsByType = new Map<SearchItemType, SearchItem[]>()
    for (const s of scored) {
      totalByType.set(s.item.type, (totalByType.get(s.item.type) ?? 0) + 1)
      const arr = itemsByType.get(s.item.type) ?? []
      if (arr.length < MAX_PER_GROUP) {
        arr.push(s.item)
        itemsByType.set(s.item.type, arr)
      }
    }
    const out: ResultsGroup[] = []
    for (const type of GROUP_ORDER) {
      const items = itemsByType.get(type)
      if (items && items.length > 0) {
        out.push({
          key: type,
          label: groupLabelFor(type),
          items,
          total: totalByType.get(type) ?? items.length,
        })
      }
    }
    return out
  }, [index, parsed.query, scope])

  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups])

  // Keep the highlight pointed at a visible item.
  useEffect(() => {
    if (flatItems.length === 0) {
      if (highlightedKey !== null) setHighlightedKey(null)
      return
    }
    const exists = flatItems.some((it) => keyFor(it) === highlightedKey)
    if (!exists) setHighlightedKey(keyFor(flatItems[0]!))
  }, [flatItems, highlightedKey])

  const activeItem = useMemo(
    () => flatItems.find((it) => keyFor(it) === highlightedKey) ?? null,
    [flatItems, highlightedKey],
  )

  function moveHighlight(delta: number) {
    if (flatItems.length === 0) return
    const idx = Math.max(
      0,
      flatItems.findIndex((it) => keyFor(it) === highlightedKey),
    )
    const next = (idx + delta + flatItems.length) % flatItems.length
    setHighlightedKey(keyFor(flatItems[next]!))
  }

  function activate(item: SearchItem, mode: 'default' | 'new-tab') {
    pushRecent(item.type, item.id)
    const target = targetForItem(item)
    if (mode === 'new-tab') {
      if (typeof window !== 'undefined') {
        window.open(hrefForTarget(target), '_blank', 'noopener')
      }
      return
    }
    onOpenChange(false)
    navigate({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to: target.to as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      search: target.search as any,
    })
  }

  function commitScopeFromFragment(fragment: string): boolean {
    const match = findScopeByCode(fragment) ?? suggestScopes(fragment)[0]
    if (!match) return false
    setScope(match)
    setSlashMode(false)
    setRaw('')
    return true
  }

  // Graceful fallback: if in slash-mode and the new fragment doesn't match any
  // scope prefix, exit slash-mode silently and treat the text as a global
  // query. Prevents the user getting stuck in a "no scope matches" dead-end.
  function handlePromptChange(next: string) {
    if (slashMode && next !== '' && suggestScopes(next).length === 0) {
      setSlashMode(false)
    }
    setRaw(next)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // Enter scope-picking mode on first "/" when the input is empty.
    if (
      e.key === '/' &&
      raw === '' &&
      !scope &&
      !slashMode &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey
    ) {
      e.preventDefault()
      setSlashMode(true)
      return
    }

    // In slash-mode, space / tab commit the best-matching scope. Space is
    // always swallowed (scope codes can't contain spaces). Tab must be
    // suppressed to keep focus in the input.
    if (slashMode && (e.key === ' ' || (e.key === 'Tab' && !e.shiftKey))) {
      e.preventDefault()
      commitScopeFromFragment(raw)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      moveHighlight(1)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      moveHighlight(-1)
      return
    }
    if (e.key === 'Enter') {
      // In slash-mode, Enter commits the scope instead of opening a result.
      if (slashMode) {
        if (commitScopeFromFragment(raw)) {
          e.preventDefault()
        }
        return
      }
      if (activeItem) {
        e.preventDefault()
        activate(activeItem, e.metaKey || e.ctrlKey ? 'new-tab' : 'default')
      }
      return
    }
    if (e.key === 'Backspace' && raw === '') {
      if (slashMode) {
        e.preventDefault()
        setSlashMode(false)
        return
      }
      if (scope) {
        e.preventDefault()
        setScope(null)
        return
      }
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-40 bg-ink/40 backdrop-blur-[1px]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'duration-150',
          )}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            'fixed top-[12vh] left-1/2 z-50 -translate-x-1/2',
            'w-[min(860px,calc(100vw-2rem))]',
            'bg-paper-raised border-hairline-strong border rounded-md',
            'shadow-none overflow-hidden',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2',
            'duration-200',
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Search the archive
          </DialogPrimitive.Title>

          <div className="border-hairline border-b">
            <SearchPrompt
              value={raw}
              scope={scope}
              slashMode={slashMode}
              pendingScopeFragment={parsed.pendingScopeFragment}
              onChange={handlePromptChange}
              onClearScope={() => setScope(null)}
              onCommitScope={(s) => {
                setScope(s)
                setSlashMode(false)
                setRaw('')
              }}
              onKeyDown={handleKeyDown}
              inputRef={inputRef}
            />
          </div>

          <div className="grid grid-cols-[320px_1fr] h-[min(520px,62vh)]">
            <div className="border-hairline overflow-hidden border-r">
              {index === null ? (
                <LoadingState error={loadError} />
              ) : (
                <SearchResultsList
                  groups={groups}
                  highlightedKey={highlightedKey}
                  onHighlight={(item) => setHighlightedKey(keyFor(item))}
                  onActivate={activate}
                  listRef={listRef}
                  query={parsed.query}
                />
              )}
            </div>
            <div className="overflow-hidden">
              {index === null ? null : <SearchPreviewPane item={activeItem} />}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function LoadingState({ error }: { error: string | null }) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center">
      {error ? (
        <p className="text-ink-muted font-serif text-sm italic">
          Couldn’t load the archive index.
        </p>
      ) : (
        <p className="text-ink-muted font-serif text-sm italic">
          Loading the archive…
        </p>
      )}
    </div>
  )
}
