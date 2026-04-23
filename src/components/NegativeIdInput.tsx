import { useRef, type KeyboardEvent, type MouseEvent } from 'react'
import { cn } from '#/lib/utils'

type SegmentKey = 'seqGlobal' | 'year' | 'seqYear'

type NegativeIdInputProps = {
  seqGlobal: string
  year: string
  seqYear: string
  onSeqGlobalChange: (value: string) => void
  onYearChange: (value: string) => void
  onSeqYearChange: (value: string) => void
  invalid?: Partial<Record<SegmentKey, boolean>>
  disabled?: boolean
  'aria-labelledby'?: string
}

export function NegativeIdInput({
  seqGlobal,
  year,
  seqYear,
  onSeqGlobalChange,
  onYearChange,
  onSeqYearChange,
  invalid,
  disabled,
  'aria-labelledby': ariaLabelledBy,
}: NegativeIdInputProps) {
  const globalRef = useRef<HTMLInputElement>(null)
  const yearRef = useRef<HTMLInputElement>(null)
  const seqYearRef = useRef<HTMLInputElement>(null)

  const focus = (key: SegmentKey, selectEnd?: boolean) => {
    const ref =
      key === 'seqGlobal' ? globalRef : key === 'year' ? yearRef : seqYearRef
    const el = ref.current
    if (!el) return
    el.focus()
    if (selectEnd) {
      const len = el.value.length
      el.setSelectionRange(len, len)
    } else {
      el.select()
    }
  }

  function handleContainerMouseDown(e: MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT') return
    e.preventDefault()
    const segments = [globalRef.current, yearRef.current, seqYearRef.current]
    const clickX = e.clientX
    let nearest: HTMLInputElement | null = null
    let nearestDistance = Infinity
    for (const seg of segments) {
      if (!seg) continue
      const rect = seg.getBoundingClientRect()
      const center = (rect.left + rect.right) / 2
      const distance = Math.abs(clickX - center)
      if (distance < nearestDistance) {
        nearest = seg
        nearestDistance = distance
      }
    }
    if (nearest) {
      nearest.focus()
      nearest.select()
    }
  }

  return (
    <div
      role="group"
      aria-labelledby={ariaLabelledBy}
      onMouseDown={handleContainerMouseDown}
      className={cn(
        'border-input flex h-9 w-full cursor-text items-center gap-1 rounded-md border bg-transparent px-3 py-1 shadow-xs transition-[color,box-shadow]',
        'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
        'font-mono text-sm tabular-nums md:text-sm',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <IdSegment
        ref={globalRef}
        value={seqGlobal}
        width={4}
        ariaLabel="Global number"
        invalid={invalid?.seqGlobal}
        disabled={disabled}
        onChange={onSeqGlobalChange}
        onComplete={() => focus('year')}
      />
      <Separator>/</Separator>
      <IdSegment
        ref={yearRef}
        value={year}
        width={4}
        ariaLabel="Year"
        invalid={invalid?.year}
        disabled={disabled}
        onChange={onYearChange}
        onComplete={() => focus('seqYear')}
        onBackBeyond={() => focus('seqGlobal', true)}
      />
      <Separator>-</Separator>
      <IdSegment
        ref={seqYearRef}
        value={seqYear}
        width={3}
        ariaLabel="Year sequence"
        invalid={invalid?.seqYear}
        disabled={disabled}
        onChange={onSeqYearChange}
        onBackBeyond={() => focus('year', true)}
      />
    </div>
  )
}

function Separator({ children }: { children: React.ReactNode }) {
  return (
    <span aria-hidden className="text-ink-muted select-none">
      {children}
    </span>
  )
}

type IdSegmentProps = {
  value: string
  width: number
  ariaLabel: string
  invalid?: boolean
  disabled?: boolean
  onChange: (value: string) => void
  onComplete?: () => void
  onBackBeyond?: () => void
}

function IdSegment({
  ref,
  value,
  width,
  ariaLabel,
  invalid,
  disabled,
  onChange,
  onComplete,
  onBackBeyond,
}: IdSegmentProps & {
  ref?: React.RefObject<HTMLInputElement | null>
}) {
  const widthCh = `${width + 0.5}ch`

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const el = e.currentTarget
    if (e.key === 'Backspace' && el.value === '' && onBackBeyond) {
      e.preventDefault()
      onBackBeyond()
    }
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-invalid={invalid ? true : undefined}
      maxLength={width}
      style={{ width: widthCh }}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={(e) => {
        const clean = e.currentTarget.value.replace(/\D/g, '').slice(0, width)
        if (clean.length === 0 || clean.length === width) return
        onChange(clean.padStart(width, '0'))
      }}
      onChange={(e) => {
        const clean = e.currentTarget.value.replace(/\D/g, '').slice(0, width)
        onChange(clean)
        if (clean.length === width && onComplete) onComplete()
      }}
      onKeyDown={handleKeyDown}
      className={cn(
        'text-ink bg-transparent text-center leading-none outline-none',
        'border-b-2 border-transparent',
        invalid ? 'border-destructive' : 'focus:border-safelight',
      )}
    />
  )
}
