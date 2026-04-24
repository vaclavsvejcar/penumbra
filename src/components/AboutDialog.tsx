import { Dialog as DialogPrimitive } from 'radix-ui'
import { ArrowUpRight, ChevronUp, X } from 'lucide-react'
import { cn } from '#/lib/utils'
import { type ThemeMode, useTheme } from './ThemeProvider'

const VERSION = 'v0.1.0'

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'auto', label: 'System' },
  { value: 'dark', label: 'Dark' },
] as const satisfies ReadonlyArray<{ value: ThemeMode; label: string }>

export function AboutDialog() {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger
        aria-label="About Penumbra"
        className={cn(
          'text-ink-muted hover:text-ink-soft data-[state=open]:text-ink-soft',
          'inline-flex items-center gap-1 rounded-sm px-1.5 py-1',
          'hover:bg-muted data-[state=open]:bg-muted transition-colors',
        )}
      >
        <span className="font-mono text-[0.65rem] tabular-nums">{VERSION}</span>
        <ChevronUp className="h-3 w-3" strokeWidth={1.5} aria-hidden />
      </DialogPrimitive.Trigger>

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
            'fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-[min(520px,calc(100vw-2rem))]',
            'bg-paper-raised border-hairline-strong border rounded-md',
            'p-8',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            'duration-200',
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            About Penumbra
          </DialogPrimitive.Title>

          <div className="mb-4 flex items-center justify-between">
            <p className="kicker">N° 00 · About</p>
            <DialogPrimitive.Close
              aria-label="Close"
              className={cn(
                'text-ink-muted hover:text-ink-soft hover:bg-muted',
                '-mr-2 inline-flex h-7 w-7 items-center justify-center rounded-sm',
                'transition-colors',
              )}
            >
              <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </DialogPrimitive.Close>
          </div>

          <div className="border-hairline space-y-5 border-t pt-5">
            <div>
              <h2 className="font-serif text-ink text-4xl leading-none italic">
                <span
                  aria-hidden
                  className="text-safelight"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  p
                </span>
                enumbra
                <span className="sr-only">penumbra</span>
              </h2>
              <p className="text-ink-soft mt-3 max-w-md text-sm leading-relaxed">
                An inventory of negatives, darkroom enlargements, and
                limited&nbsp;editions. Kept honest, kept quiet.
              </p>
            </div>

            <p className="text-sm">
              <a
                href="https://github.com/vaclavsvejcar/penumbra"
                target="_blank"
                rel="noreferrer"
                className="text-ink hover:text-safelight inline-flex items-baseline gap-0.5 transition-colors"
              >
                Source on GitHub
                <ArrowUpRight
                  className="h-3 w-3 self-center"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </a>
              <span className="text-ink-muted mx-2">·</span>
              <span className="text-ink-muted font-mono text-[0.85em] tabular-nums">
                {VERSION}
              </span>
            </p>

            <ThemeRow />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function ThemeRow() {
  const { mode, setMode } = useTheme()
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="kicker">Appearance</span>
      <div className="flex items-center gap-1">
        {themeOptions.map((opt) => {
          const isActive = opt.value === mode
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                if (!isActive) setMode(opt.value)
              }}
              className={cn(
                'rounded-sm px-2 py-0.5 text-sm transition-colors',
                isActive
                  ? 'bg-muted text-ink'
                  : 'text-ink-muted hover:bg-muted/50 hover:text-ink',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
