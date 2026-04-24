import { useEffect, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Github, Search } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { useSearch } from './SearchProvider'
import { cn } from '#/lib/utils'
import { getNavCounts, type NavCounts } from '#/server/navCounts'

type NavItemProps = {
  to: string
  label: string
  count?: number
  onNavigate?: () => void
}

function NavItem({ to, label, count, onNavigate }: NavItemProps) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="group relative flex items-center justify-between rounded-sm py-1.5 pr-2 pl-3 text-sm transition-colors hover:bg-muted/50"
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span
              aria-hidden
              className="bg-safelight absolute top-[28%] bottom-[28%] left-0 w-[1.5px] rounded-r-sm"
            />
          ) : null}
          <span
            className={cn(
              'transition-colors',
              isActive
                ? 'text-ink font-medium'
                : 'text-ink-soft group-hover:text-ink',
            )}
          >
            {label}
          </span>
          {count !== undefined ? (
            <span className="text-ink-muted font-mono text-[0.7rem] tabular-nums">
              {count}
            </span>
          ) : null}
        </>
      )}
    </Link>
  )
}

type NavGroupProps = {
  label: string
  children: React.ReactNode
}

function NavGroup({ label, children }: NavGroupProps) {
  return (
    <div className="mt-7 first:mt-0">
      <p className="kicker pb-2.5 pl-3">{label}</p>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

type SidebarProps = {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const search = useSearch()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [counts, setCounts] = useState<NavCounts | null>(null)

  useEffect(() => {
    let cancelled = false
    getNavCounts()
      .then((c) => {
        if (!cancelled) setCounts(c)
      })
      .catch(() => {
        /* silent: counts are a nice-to-have */
      })
    return () => {
      cancelled = true
    }
  }, [pathname])

  function handleSearchClick() {
    onNavigate?.()
    search.open()
  }

  return (
    <nav className="flex h-full w-60 shrink-0 flex-col">
      <div className="px-6 py-6">
        <Link
          to="/"
          onClick={onNavigate}
          activeProps={{ 'aria-current': undefined }}
          className="inline-flex items-baseline no-underline"
        >
          <span
            aria-hidden
            className="text-safelight font-serif leading-none italic"
            style={{ fontSize: '2.25rem', letterSpacing: '-0.02em' }}
          >
            p
          </span>
          <span className="text-ink font-serif text-2xl leading-none italic">
            enumbra
          </span>
          <span className="sr-only">penumbra</span>
        </Link>
      </div>

      <div className="hidden px-6 pb-4 md:block">
        <button
          type="button"
          onClick={handleSearchClick}
          aria-label="Search the archive"
          className={cn(
            'group/search flex w-full items-center justify-between gap-2 rounded-sm',
            'border-hairline border px-3 py-1.5 text-left',
            'hover:border-hairline-strong transition-colors',
          )}
        >
          <span className="text-ink-muted group-hover/search:text-ink-soft flex min-w-0 items-center gap-2 transition-colors">
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate font-serif text-[0.9rem] italic">
              Search archive…
            </span>
          </span>
          <kbd className="border-hairline text-ink-muted shrink-0 rounded-sm border px-1.5 py-px font-mono text-[0.65rem] leading-none tabular-nums">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavItem to="/" label="Dashboard" onNavigate={onNavigate} />

        <NavGroup label="Archive">
          <NavItem
            to="/negatives"
            label="Negatives"
            count={counts?.negatives}
            onNavigate={onNavigate}
          />
          <NavItem to="/editions" label="Editions" onNavigate={onNavigate} />
          <NavItem to="/prints" label="Prints" onNavigate={onNavigate} />
        </NavGroup>

        <NavGroup label="Orders">
          <NavItem
            to="/customers"
            label="Customers"
            count={counts?.customers}
            onNavigate={onNavigate}
          />
          <NavItem to="/orders" label="Orders" onNavigate={onNavigate} />
        </NavGroup>

        <NavGroup label="Admin">
          <NavItem to="/lookups" label="Lookups" onNavigate={onNavigate} />
          <NavItem to="/storage" label="Storage" onNavigate={onNavigate} />
        </NavGroup>
      </div>

      <div className="border-hairline flex items-center justify-between gap-2 border-t px-6 py-3">
        <span className="text-ink-muted font-mono text-[0.65rem] tabular-nums">
          v0.1.0
        </span>
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/vaclavsvejcar/penumbra"
            target="_blank"
            rel="noreferrer"
            aria-label="Open Penumbra on GitHub"
            className="text-ink-soft hover:text-ink hover:bg-muted inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors"
          >
            <Github className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
