import {
  createFileRoute,
  Link,
  notFound,
  useRouter,
} from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { CustomerSheet } from '#/components/CustomerSheet'
import { type Customer, type CustomerKind } from '#/db/schema'
import { getCustomer } from '#/server/customers'

export const Route = createFileRoute('/customers/$id')({
  component: CustomerDetail,
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

function CustomerDetail() {
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
          <h1 className="font-serif text-ink text-5xl leading-[0.95] font-normal tracking-tight italic break-words sm:text-6xl">
            {customer.name}
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

      <motion.div variants={item} className="mt-14 space-y-0">
        <ContactSection customer={customer} />
        <NotesSection notes={customer.notes} />
        <OrdersSection />
        <AuditSection customer={customer} />
      </motion.div>

      <CustomerSheet
        key={customer.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
      />
    </motion.section>
  )
}

function ContactSection({ customer }: { customer: Customer }) {
  return (
    <Section title="Contact">
      <DefinitionList>
        <Def term="Email" value={customer.email} />
        <Def term="Phone" value={customer.phone} mono />
        <Def term="City" value={customer.city} />
      </DefinitionList>
    </Section>
  )
}

function NotesSection({ notes }: { notes: string | null }) {
  return (
    <Section title="Notes">
      {notes ? (
        <p className="text-ink whitespace-pre-wrap text-sm leading-relaxed">
          {notes}
        </p>
      ) : (
        <p className="text-ink-muted text-sm italic">No notes.</p>
      )}
    </Section>
  )
}

function OrdersSection() {
  return (
    <Section title="Orders">
      <div className="border-hairline flex h-32 items-center justify-center rounded-md border border-dashed">
        <p className="kicker text-ink-muted">Coming soon</p>
      </div>
    </Section>
  )
}

function AuditSection({ customer }: { customer: Customer }) {
  return (
    <Section title="Audit">
      <DefinitionList>
        <Def term="Created" value={dateTimeFmt.format(customer.createdAt)} mono />
        <Def term="Updated" value={dateTimeFmt.format(customer.updatedAt)} mono />
      </DefinitionList>
    </Section>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-hairline border-t py-8 first:border-t-0 first:pt-0">
      <p className="kicker mb-5">{title}</p>
      {children}
    </section>
  )
}

function DefinitionList({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-[7rem_1fr] gap-x-6 gap-y-3 text-sm">
      {children}
    </dl>
  )
}

function Def({
  term,
  value,
  mono,
}: {
  term: string
  value: string | null
  mono?: boolean
}) {
  return (
    <>
      <dt className="kicker pt-0.5">{term}</dt>
      <dd
        className={
          value
            ? mono
              ? 'text-ink font-mono tabular-nums'
              : 'text-ink'
            : 'text-ink-muted'
        }
      >
        {value ?? '—'}
      </dd>
    </>
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
