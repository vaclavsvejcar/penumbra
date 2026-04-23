import { Check, ChevronDown } from 'lucide-react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { cn } from '#/lib/utils'

export type SearchSelectItem = {
  key: string
  label: string
  subtitle?: string
  searchText: string
}

type SearchSelectProps = {
  items: SearchSelectItem[]
  value: string | null
  onChange: (key: string | null) => void
  placeholder?: string
  emptyLabel?: string
  searchPlaceholder?: string
  /** When set, an extra row at the top selects null (e.g. "None"). */
  clearLabel?: string
  disabled?: boolean
  id?: string
  className?: string
  'aria-labelledby'?: string
}

type ListEntry =
  | { kind: 'clear'; key: string }
  | { kind: 'item'; key: string; item: SearchSelectItem }

export function SearchSelect({
  items,
  value,
  onChange,
  placeholder = 'Select…',
  emptyLabel = 'No matches.',
  searchPlaceholder = 'Search…',
  clearLabel,
  disabled,
  id,
  className,
  'aria-labelledby': ariaLabelledBy,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = useMemo(
    () => items.find((i) => i.key === value) ?? null,
    [items, value],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) => i.searchText.includes(q))
  }, [items, query])

  const list = useMemo<ListEntry[]>(() => {
    const entries: ListEntry[] = filtered.map((item) => ({
      kind: 'item',
      key: item.key,
      item,
    }))
    if (clearLabel && !query.trim()) {
      return [{ kind: 'clear', key: '__clear' }, ...entries]
    }
    return entries
  }, [filtered, clearLabel, query])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setHighlightedIndex(0)
    }
  }, [open])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [query])

  // Scroll highlighted item into view on keyboard navigation.
  useEffect(() => {
    const ul = listRef.current
    if (!ul) return
    const li = ul.children[highlightedIndex] as HTMLElement | undefined
    if (!li) return
    const ulRect = ul.getBoundingClientRect()
    const liRect = li.getBoundingClientRect()
    if (liRect.top < ulRect.top) {
      li.scrollIntoView({ block: 'nearest' })
    } else if (liRect.bottom > ulRect.bottom) {
      li.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  function commit(entry: ListEntry | undefined) {
    if (!entry) return
    if (entry.kind === 'clear') {
      onChange(null)
    } else {
      onChange(entry.item.key)
    }
    setOpen(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, Math.max(list.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setHighlightedIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setHighlightedIndex(Math.max(list.length - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      commit(list[highlightedIndex])
    }
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-labelledby={ariaLabelledBy}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            'border-input flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'disabled:pointer-events-none disabled:opacity-50',
            className,
          )}
        >
          {selected ? (
            <span className="flex min-w-0 items-baseline gap-1.5">
              <span className="text-ink truncate">{selected.label}</span>
              {selected.subtitle ? (
                <span className="text-ink-muted truncate text-xs">
                  {selected.subtitle}
                </span>
              ) : null}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown
            aria-hidden
            className="text-ink-muted ml-2 size-4 shrink-0"
          />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          collisionPadding={8}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            inputRef.current?.focus()
          }}
          className={cn(
            'border-hairline bg-paper z-50 overflow-hidden rounded-md border shadow-sm',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          )}
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
          <div className="border-hairline border-b px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              autoComplete="off"
              spellCheck={false}
              className="text-ink placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
            />
          </div>
          {list.length === 0 ? (
            <p className="text-ink-muted px-3 py-3 text-sm italic">
              {emptyLabel}
            </p>
          ) : (
            <ul
              ref={listRef}
              role="listbox"
              className="max-h-64 overflow-y-auto py-1"
            >
              {list.map((entry, idx) => {
                const isHighlighted = idx === highlightedIndex
                const isSelected =
                  entry.kind === 'clear' ? value === null : entry.key === value
                return (
                  <li
                    key={entry.key}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      commit(entry)
                    }}
                    className={cn(
                      'flex cursor-pointer items-baseline gap-2 px-3 py-1.5 text-sm',
                      isHighlighted && 'bg-muted/40',
                    )}
                  >
                    {entry.kind === 'clear' ? (
                      <span className="text-ink-soft italic">{clearLabel}</span>
                    ) : (
                      <>
                        <span className="text-ink truncate">
                          {entry.item.label}
                        </span>
                        {entry.item.subtitle ? (
                          <span className="text-ink-muted truncate text-xs">
                            {entry.item.subtitle}
                          </span>
                        ) : null}
                      </>
                    )}
                    {isSelected ? (
                      <Check
                        aria-hidden
                        className="text-safelight ml-auto size-4 shrink-0"
                      />
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
