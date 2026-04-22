import { motion } from 'motion/react'
import { type KeyboardEvent, type RefObject, useEffect } from 'react'
import { cn } from '#/lib/utils'
import { suggestScopes } from '#/lib/search/scope'
import type { ScopeDef } from '#/lib/search/types'

type Props = {
  value: string
  scope: ScopeDef | null
  slashMode: boolean
  pendingScopeFragment: string | null
  onChange: (next: string) => void
  onClearScope: () => void
  onCommitScope: (scope: ScopeDef) => void
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  inputRef: RefObject<HTMLInputElement | null>
}

export function SearchPrompt({
  value,
  scope,
  slashMode,
  pendingScopeFragment,
  onChange,
  onClearScope,
  onCommitScope,
  onKeyDown,
  inputRef,
}: Props) {
  // Keep focus on the input whenever the "mode" shifts (scope on/off, slash
  // on/off). Without this the decorative toggles could steal focus via re-render.
  useEffect(() => {
    inputRef.current?.focus()
  }, [scope, slashMode, inputRef])

  const suggestions =
    pendingScopeFragment !== null ? suggestScopes(pendingScopeFragment) : []

  const placeholder = scope
    ? `Search ${scope.label.toLowerCase()}…`
    : slashMode
      ? 'Type a scope code…'
      : 'Search the archive…'

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-5 py-4">
        <motion.span
          aria-hidden
          animate={{ scale: slashMode ? 1.03 : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            'shrink-0 inline-flex h-8 min-w-[1.4rem] items-center justify-center',
            'font-serif text-2xl leading-none italic select-none',
            'transition-colors duration-150 rounded-sm px-1.5',
            slashMode
              ? 'bg-safelight-soft text-safelight-strong'
              : 'text-safelight',
          )}
          style={{ letterSpacing: '-0.02em' }}
        >
          /
        </motion.span>

        {scope ? (
          <button
            type="button"
            onClick={onClearScope}
            aria-label={`Clear ${scope.label} scope`}
            className={cn(
              'border-hairline-strong text-ink shrink-0 rounded-sm border px-2 py-0.5',
              'font-mono text-[0.7rem] tracking-[0.14em] uppercase',
              'hover:border-safelight hover:text-safelight transition-colors',
            )}
          >
            {scope.code}
          </button>
        ) : null}

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          placeholder={placeholder}
          className={cn(
            'flex-1 bg-transparent text-ink text-lg leading-none',
            'placeholder:text-ink-muted placeholder:italic placeholder:font-serif',
            'border-0 outline-none focus:outline-none',
          )}
        />

        <span className="text-ink-muted hidden font-mono text-[0.7rem] md:inline">
          esc
        </span>
      </div>

      {suggestions.length > 0 ? (
        <div className="border-hairline absolute top-full left-0 right-0 z-10 border-t bg-paper-raised">
          <p className="kicker px-5 pt-3">Scope</p>
          <ul className="px-3 py-2">
            {suggestions.map((s) => (
              <li key={s.code}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onCommitScope(s)
                  }}
                  className={cn(
                    'w-full text-left flex items-baseline gap-3 rounded-sm px-2 py-1.5',
                    'hover:bg-muted/60 transition-colors',
                  )}
                >
                  <span className="text-ink-muted font-mono text-[0.72rem] tracking-[0.14em] uppercase">
                    /{s.code}
                  </span>
                  <span className="text-ink text-sm">{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
