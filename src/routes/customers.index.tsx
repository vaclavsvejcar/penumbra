import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { CustomerSheet } from '#/components/CustomerSheet'
import { type Customer, type CustomerKind } from '#/db/schema'
import { listCustomers } from '#/server/customers'

export const Route = createFileRoute('/customers/')({
  component: Customers,
  loader: () => listCustomers(),
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

const kindLabel: Record<CustomerKind, string> = {
  collector: 'Collector',
  gallery: 'Gallery',
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function Customers() {
  const customers = Route.useLoaderData()
  const [open, setOpen] = useState(false)

  return (
    <motion.section
      className="py-16 sm:py-24"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <motion.div
        variants={item}
        className="flex items-end justify-between gap-6"
      >
        <div>
          <p className="kicker mb-4">Orders</p>
          <h1 className="font-serif text-ink mb-4 text-5xl leading-[0.95] font-normal tracking-tight italic sm:text-6xl">
            Customers
          </h1>
          <p className="text-ink-soft max-w-xl text-base leading-relaxed sm:text-lg">
            Collectors and galleries. Names behind the prints.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="shrink-0"
        >
          <Plus aria-hidden className="size-4" />
          Add customer
        </Button>
      </motion.div>

      <motion.div variants={item} className="mt-14">
        {customers.length === 0 ? (
          <EmptyState />
        ) : (
          <CustomerList rows={customers} />
        )}
      </motion.div>

      <CustomerSheet open={open} onOpenChange={setOpen} />
    </motion.section>
  )
}

function EmptyState() {
  return (
    <div className="border-hairline flex h-72 flex-col items-center justify-center gap-3 rounded-md border border-dashed">
      <p className="kicker text-ink-muted">No customers yet</p>
      <p className="text-ink-soft font-serif text-xl italic">
        The ledger is empty.
      </p>
    </div>
  )
}

function CustomerList({ rows }: { rows: Customer[] }) {
  return (
    <ul className="border-hairline border-t">
      {rows.map((c, i) => (
        <li key={c.id} className="border-hairline border-b">
          <Link
            to="/customers/$id"
            params={{ id: String(c.id) }}
            className="hover:bg-muted/40 grid grid-cols-[2.5rem_1fr_auto_auto_auto] items-center gap-4 py-4 no-underline transition-colors sm:gap-6"
          >
            <span className="text-ink-muted font-mono text-xs tabular-nums">
              N° {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <p className="text-ink truncate text-sm font-medium">{c.name}</p>
              {c.email ? (
                <p className="text-ink-muted truncate text-xs">{c.email}</p>
              ) : null}
            </div>
            <Badge variant="outline" className="text-ink-soft font-normal">
              {kindLabel[c.kind]}
            </Badge>
            <span className="text-ink-soft hidden text-sm sm:inline">
              {c.city ?? '—'}
            </span>
            <span className="text-ink-muted font-mono text-xs tabular-nums">
              {dateFmt.format(c.createdAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
