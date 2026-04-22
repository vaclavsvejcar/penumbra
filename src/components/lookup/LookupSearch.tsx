import { Search } from 'lucide-react'
import { Input } from '#/components/ui/input'

type LookupSearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  total: number
  filtered: number
}

export function LookupSearch({
  value,
  onChange,
  placeholder,
  total,
  filtered,
}: LookupSearchProps) {
  const querying = value.trim().length > 0
  return (
    <div className="border-hairline flex items-center justify-between gap-4 border-b py-2">
      <div className="relative flex max-w-sm flex-1 items-center">
        <Search
          aria-hidden
          className="text-ink-soft pointer-events-none absolute left-0 size-4"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              onChange('')
              ;(e.currentTarget as HTMLInputElement).blur()
            }
          }}
          className="placeholder:text-ink-soft h-auto w-full border-0 bg-transparent py-1 pr-0 pl-6 text-sm shadow-none focus-visible:border-0 focus-visible:ring-0"
        />
      </div>
      <span className="text-ink-muted font-mono text-xs tabular-nums shrink-0">
        {querying ? (
          <>
            N° {String(filtered).padStart(2, '0')}/
            {String(total).padStart(2, '0')}
          </>
        ) : (
          <>N° {String(filtered).padStart(2, '0')}</>
        )}
      </span>
    </div>
  )
}
