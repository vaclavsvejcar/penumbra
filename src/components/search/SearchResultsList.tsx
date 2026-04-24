import { type ReactNode, type RefObject, useEffect, useRef } from 'react'
import { cn } from '#/lib/utils'
import type { SearchItem } from '#/lib/search/types'

export type ResultsGroup = {
  key: string
  label: string
  items: ReadonlyArray<SearchItem>
  total: number
}

type Props = {
  groups: ReadonlyArray<ResultsGroup>
  highlightedKey: string | null
  onHighlight: (item: SearchItem) => void
  onActivate: (item: SearchItem, modifier: 'default' | 'new-tab') => void
  listRef: RefObject<HTMLDivElement | null>
  query: string
}

export function keyFor(item: SearchItem): string {
  return `${item.type}:${item.id}`
}

function hasOptions(item: SearchItem): boolean {
  return item.type === 'command' && item.data.kind === 'options'
}

/**
 * Substring highlight. Falls back to plain text when the query is only a
 * subsequence match (no contiguous span to highlight).
 */
function renderHighlighted(text: string, query: string): ReactNode {
  const q = query.trim()
  if (!q) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      <span className="text-ink-soft">{text.slice(0, idx)}</span>
      <span className="text-ink font-medium">
        {text.slice(idx, idx + q.length)}
      </span>
      <span className="text-ink-soft">{text.slice(idx + q.length)}</span>
    </>
  )
}

export function SearchResultsList({
  groups,
  highlightedKey,
  onHighlight,
  onActivate,
  listRef,
  query,
}: Props) {
  const activeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [highlightedKey])

  if (groups.length === 0) {
    return (
      <div
        ref={listRef}
        className="flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <p className="text-ink-muted font-serif text-base italic">
          No match in the archive.
        </p>
        {query ? (
          <p className="text-ink-muted mt-2 font-mono text-[0.72rem]">
            for “{query}”
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div ref={listRef} className="h-full overflow-y-auto">
      {groups.map((group, groupIdx) => (
        <section key={group.key} className={groupIdx > 0 ? 'mt-2' : undefined}>
          <div className="border-hairline flex items-baseline justify-between border-b px-5 pt-4 pb-2">
            <p className="kicker">{group.label}</p>
            <p className="text-ink-muted font-mono text-[0.65rem] tabular-nums">
              {group.total}
            </p>
          </div>
          <ul className="px-2 py-1">
            {group.items.map((item) => {
              const k = keyFor(item)
              const isActive = k === highlightedKey
              return (
                <li key={k}>
                  <button
                    ref={isActive ? activeRef : undefined}
                    type="button"
                    onMouseEnter={() => onHighlight(item)}
                    onFocus={() => onHighlight(item)}
                    onClick={(e) =>
                      onActivate(
                        item,
                        e.metaKey || e.ctrlKey ? 'new-tab' : 'default',
                      )
                    }
                    className={cn(
                      'relative flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left',
                      'transition-colors',
                      isActive ? 'bg-muted/50' : 'hover:bg-muted/30',
                    )}
                  >
                    {isActive ? (
                      <span
                        aria-hidden
                        className="bg-safelight absolute top-[22%] bottom-[22%] left-0 w-[2px] rounded-r-sm"
                      />
                    ) : null}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span
                        className={cn(
                          'truncate text-sm',
                          isActive ? 'text-ink font-medium' : 'text-ink',
                        )}
                      >
                        {renderHighlighted(item.title, query)}
                      </span>
                      {item.subtitle ? (
                        <span className="text-ink-muted mt-0.5 truncate text-[0.75rem]">
                          {item.subtitle}
                        </span>
                      ) : null}
                    </div>
                    {hasOptions(item) ? (
                      <span
                        aria-hidden
                        className={cn(
                          'shrink-0 font-mono text-base leading-none transition-colors',
                          isActive ? 'text-ink-soft' : 'text-ink-muted',
                        )}
                      >
                        ›
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
