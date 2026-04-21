import {
  createFileRoute,
  Link,
  notFound,
  Outlet,
  useRouter,
} from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { CustomerSheet } from '#/components/CustomerSheet'
import { cn } from '#/lib/utils'
import { type CustomerKind } from '#/db/schema'
import { getCustomer } from '#/server/customers'

export const Route = createFileRoute('/customers/$id')({
  component: CustomerDetailLayout,
  loader: async ({ params }) => {
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) throw notFound()
    const customer = await getCustomer({ data: id })
    if (!customer) throw notFound()
    return customer
  },
  notFoundComponent: CustomerNotFound,
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

const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const tabs = [
  { to: '/customers/$id', label: 'Overview', exact: true },
  { to: '/customers/$id/orders', label: 'Orders', exact: false },
  { to: '/customers/$id/notes', label: 'Notes', exact: false },
] as const

function CustomerDetailLayout() {
  const customer = Route.useLoaderData()
  const [editOpen, setEditOpen] = useState(false)

  return (
    <motion.section
      className="py-16 sm:py-24"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <motion.div variants={item}>
        <Link
          to="/customers"
          className="text-ink-soft hover:text-ink inline-flex items-center gap-1.5 text-xs no-underline"
        >
          <ArrowLeft aria-hidden className="size-3.5" />
          <span className="kicker">Customers</span>
        </Link>
      </motion.div>

      <motion.div
        variants={item}
        className="mt-8 flex items-end justify-between gap-6"
      >
        <div className="min-w-0">
          <p className="kicker mb-4 flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-ink-soft font-normal normal-case tracking-normal"
            >
              {kindLabel[customer.kind]}
            </Badge>
            <span>·</span>
            <span className="font-mono tabular-nums">
              {dateFmt.format(customer.createdAt)}
            </span>
          </p>
          <h1 className="font-serif text-5xl leading-[0.95] font-normal tracking-tight italic break-words sm:text-6xl">
            <span className="text-safelight">{customer.name.charAt(0)}</span>
            <span className="text-ink">{customer.name.slice(1)}</span>
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
          className="shrink-0"
        >
          <Pencil aria-hidden className="size-4" />
          Edit
        </Button>
      </motion.div>

      <motion.nav
        variants={item}
        className="border-hairline mt-12 flex gap-8 overflow-x-auto border-b whitespace-nowrap"
        aria-label="Customer sections"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            params={{ id: String(customer.id) }}
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
                    layoutId="customer-tab-indicator"
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

      <motion.p
        variants={item}
        className="text-ink-muted mt-16 font-mono text-[0.65rem] tracking-wide tabular-nums"
      >
        Created {dateTimeFmt.format(customer.createdAt)} · Updated{' '}
        {dateTimeFmt.format(customer.updatedAt)}
      </motion.p>

      <CustomerSheet
        key={customer.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
      />
    </motion.section>
  )
}

function CustomerNotFound() {
  const router = useRouter()
  return (
    <section className="py-24">
      <p className="kicker mb-4">404</p>
      <h1 className="font-serif text-ink mb-4 text-5xl leading-[0.95] italic">
        Customer not found.
      </h1>
      <p className="text-ink-soft mb-8 max-w-xl text-base leading-relaxed">
        This entry has been removed or never existed.
      </p>
      <Button variant="outline" size="sm" onClick={() => router.history.back()}>
        <ArrowLeft aria-hidden className="size-4" />
        Go back
      </Button>
    </section>
  )
}
