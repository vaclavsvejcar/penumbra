import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/settings/')({
  component: SettingsOverview,
})

const item = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

type Category = {
  to:
    | '/settings/customer-types'
    | '/settings/manufacturers'
    | '/settings/film-stocks'
    | '/settings/paper-stocks'
  kicker: string
  title: string
  description: string
}

const categories: Category[] = [
  {
    to: '/settings/customer-types',
    kicker: 'Lookup',
    title: 'Customer types',
    description:
      'Manage the kinds of customers — collectors, galleries, and whatever else belongs in your ledger.',
  },
  {
    to: '/settings/manufacturers',
    kicker: 'Lookup',
    title: 'Manufacturers',
    description:
      'Brands of film, paper, and chemistry. One shared list across the whole archive.',
  },
  {
    to: '/settings/film-stocks',
    kicker: 'Lookup',
    title: 'Film stocks',
    description:
      'The emulsions you shoot, each bound to its manufacturer, with box speed and process.',
  },
  {
    to: '/settings/paper-stocks',
    kicker: 'Lookup',
    title: 'Paper stocks',
    description:
      'Darkroom papers — base, tone, and whether they’re variable-contrast or graded.',
  },
]

function SettingsOverview() {
  return (
    <motion.div initial="hidden" animate="visible" variants={item}>
      <ul className="border-hairline border-t">
        {categories.map((c) => (
          <li key={c.to} className="border-hairline border-b">
            <Link
              to={c.to}
              className="hover:bg-muted/40 flex items-center justify-between gap-6 py-5 no-underline transition-colors"
            >
              <div className="min-w-0">
                <p className="kicker mb-1.5">{c.kicker}</p>
                <p className="text-ink text-base font-medium">{c.title}</p>
                <p className="text-ink-soft mt-1 max-w-2xl text-sm leading-relaxed">
                  {c.description}
                </p>
              </div>
              <ArrowRight
                aria-hidden
                className="text-ink-muted size-4 shrink-0"
              />
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
