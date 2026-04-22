import { type RefObject, useEffect, useRef } from 'react'
import { cn } from '#/lib/utils'
import type { SearchItem } from '#/lib/search/types'

export type ResultsGroup = {
  key: string
  label: string
  items: ReadonlyArray<SearchItem>
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
        <section
          key={group.key}
          className={groupIdx > 0 ? 'mt-2' : undefined}
        >
          <p className="kicker border-hairline border-b px-5 pt-4 pb-2">
            {group.label}
          </p>
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
                      'relative flex w-full items-baseline gap-3 rounded-sm px-3 py-2 text-left',
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
                    <span className="text-ink-muted shrink-0 w-28 font-mono text-[0.7rem] tracking-[0.08em] tabular-nums">
                      {item.kicker}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-sm',
                          isActive ? 'text-ink font-medium' : 'text-ink',
                        )}
                      >
                        {item.title}
                      </span>
                      {item.subtitle ? (
                        <span className="text-ink-muted mt-0.5 block truncate text-[0.75rem]">
                          {item.subtitle}
                        </span>
                      ) : null}
                    </span>
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
