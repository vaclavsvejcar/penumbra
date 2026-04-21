import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'
import { cn } from '#/lib/utils'

type NavItemProps = {
  to: string
  label: string
  onNavigate?: () => void
}

function NavItem({ to, label, onNavigate }: NavItemProps) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="group relative flex items-center rounded-sm py-1.5 pr-2 pl-3 text-sm transition-colors hover:bg-muted/50"
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span
              aria-hidden
              className="bg-safelight absolute top-[22%] bottom-[22%] left-0 w-[2px] rounded-r-sm"
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
      <p className="kicker pb-2 pl-3">{label}</p>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

type SidebarProps = {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps) {
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

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavItem to="/" label="Dashboard" onNavigate={onNavigate} />

        <NavGroup label="Archive">
          <NavItem to="/negatives" label="Negatives" onNavigate={onNavigate} />
          <NavItem to="/editions" label="Editions" onNavigate={onNavigate} />
          <NavItem to="/prints" label="Prints" onNavigate={onNavigate} />
        </NavGroup>

        <NavGroup label="Orders">
          <NavItem to="/customers" label="Customers" onNavigate={onNavigate} />
          <NavItem to="/orders" label="Orders" onNavigate={onNavigate} />
        </NavGroup>
      </div>

      <div className="border-hairline flex items-center justify-end border-t px-4 py-3">
        <ThemeToggle />
      </div>
    </nav>
  )
}
