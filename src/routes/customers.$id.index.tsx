import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import type { CustomerWithType } from '#/db/schema'

export const Route = createFileRoute('/customers/$id/')({
  component: CustomerOverview,
})

const parent = getRouteApi('/customers/$id')

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
}

const item = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const NOTES_PREVIEW_CHARS = 240

// TODO: derive from real orders once the orders table exists.
const hasOrders = (_customer: CustomerWithType) => false

function CustomerOverview() {
  const { customer } = parent.useLoaderData()

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={container}
      className="space-y-0"
    >
      <ContactSnapshot customer={customer} />
      {hasOrders(customer) ? <StatsSection customer={customer} /> : null}
      <NotesPreview customer={customer} />
    </motion.div>
  )
}

function ContactSnapshot({ customer }: { customer: CustomerWithType }) {
  return (
    <Section title="Contact">
      <dl className="grid grid-cols-[7rem_1fr] gap-x-6 gap-y-3 text-sm">
        <Def term="Email" value={customer.email} />
        <Def term="Phone" value={customer.phone} mono />
        <Def term="City" value={customer.city} />
      </dl>
    </Section>
  )
}

function StatsSection({ customer }: { customer: CustomerWithType }) {
  return (
    <Section title="At a glance">
      <div className="border-hairline grid grid-cols-2 border-t sm:grid-cols-4">
        <Stat label="Total orders" value="—" />
        <Stat label="Lifetime value" value="—" />
        <Stat label="Last order" value="—" />
        <Stat
          label="Customer since"
          value={dateFmt.format(customer.createdAt)}
        />
      </div>
    </Section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-hairline border-b py-5 pr-4 pl-0 first:pl-0 sm:border-b-0 sm:border-l sm:pl-6 sm:first:border-l-0 sm:first:pl-0">
      <p className="kicker mb-2">{label}</p>
      <p className="text-ink font-mono text-2xl tabular-nums">{value}</p>
    </div>
  )
}

function NotesPreview({ customer }: { customer: CustomerWithType }) {
  if (!customer.notes) return null
  const preview =
    customer.notes.length > NOTES_PREVIEW_CHARS
      ? customer.notes.slice(0, NOTES_PREVIEW_CHARS).trimEnd() + '…'
      : customer.notes
  const truncated = preview !== customer.notes

  return (
    <Section title="Notes">
      <p className="text-ink max-w-2xl text-sm leading-relaxed whitespace-pre-wrap">
        {preview}
      </p>
      {truncated ? (
        <Link
          to="/customers/$id/notes"
          params={{ id: String(customer.id) }}
          className="text-ink-soft hover:text-ink mt-4 inline-flex items-center gap-1.5 text-xs no-underline"
        >
          <span className="kicker">View all notes</span>
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      ) : null}
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
    <motion.section
      variants={item}
      className="border-hairline border-t py-8 first:border-t-0 first:pt-0"
    >
      <p className="kicker mb-5">{title}</p>
      {children}
    </motion.section>
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
