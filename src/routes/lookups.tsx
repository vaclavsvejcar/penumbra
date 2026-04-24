import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/lookups')({
  component: LookupsLayout,
})

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
}

const tabs = [
  { to: '/lookups', label: 'Overview', exact: true },
  { to: '/lookups/customer-types', label: 'Customer types', exact: false },
  { to: '/lookups/manufacturers', label: 'Manufacturers', exact: false },
  { to: '/lookups/film-stocks', label: 'Film stocks', exact: false },
  { to: '/lookups/paper-stocks', label: 'Paper stocks', exact: false },
  { to: '/lookups/developers', label: 'Developers', exact: false },
  {
    to: '/lookups/developer-dilutions',
    label: 'Dilutions',
    exact: false,
  },
] as const

function LookupsLayout() {
  return (
    <motion.section
      className="py-16 sm:py-24"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <motion.div variants={item}>
        <p className="kicker mb-4">Admin</p>
        <h1 className="font-serif text-ink mb-4 text-5xl leading-[0.95] font-normal tracking-tight italic sm:text-6xl">
          Lookups
        </h1>
        <p className="text-ink-soft max-w-xl text-base leading-relaxed sm:text-lg">
          Reference data that shapes the rest of the app — customers,
          materials, chemistry.
        </p>
      </motion.div>

      <motion.nav
        variants={item}
        className="border-hairline mt-12 flex gap-8 overflow-x-auto overflow-y-hidden border-b whitespace-nowrap"
        aria-label="Lookup sections"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            activeOptions={{ exact: tab.exact }}
            className="group relative py-3 no-underline"
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'text-[0.7rem] font-medium tracking-[0.18em] uppercase transition-colors',
                    isActive
                      ? 'text-safelight'
                      : 'text-ink-muted group-hover:text-ink',
                  )}
                >
                  {tab.label}
                </span>
                {isActive ? (
                  <motion.span
                    layoutId="lookups-tab-indicator"
                    aria-hidden
                    className="bg-safelight absolute right-0 -bottom-px left-0 h-[2px]"
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 40,
                    }}
                  />
                ) : (
                  <span
                    aria-hidden
                    className="bg-safelight/40 absolute right-0 -bottom-px left-0 h-[2px] opacity-0 transition-opacity group-hover:opacity-100"
                  />
                )}
              </>
            )}
          </Link>
        ))}
      </motion.nav>

      <motion.div variants={item} className="pt-10">
        <Outlet />
      </motion.div>
    </motion.section>
  )
}
