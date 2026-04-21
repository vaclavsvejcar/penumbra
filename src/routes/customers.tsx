import { createFileRoute, useRouter } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { customerKinds, type Customer, type CustomerKind } from '#/db/schema'
import { isValidEmail } from '#/lib/validation'
import { createCustomer, listCustomers } from '#/server/customers'

export const Route = createFileRoute('/customers')({
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
      <motion.div variants={item} className="flex items-end justify-between gap-6">
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
        {customers.length === 0 ? <EmptyState /> : <CustomerList rows={customers} />}
      </motion.div>

      <AddCustomerSheet open={open} onOpenChange={setOpen} />
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
        <li
          key={c.id}
          className="border-hairline grid grid-cols-[2.5rem_1fr_auto_auto_auto] items-center gap-4 border-b py-4 sm:gap-6"
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
        </li>
      ))}
    </ul>
  )
}

type AddCustomerSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function AddCustomerSheet({ open, onOpenChange }: AddCustomerSheetProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<CustomerKind>('collector')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedEmail = email.trim()
  const emailError =
    trimmedEmail.length > 0 && !isValidEmail(trimmedEmail)
      ? 'Enter a valid email address.'
      : null

  const phoneError =
    phone.length > 0 && !isValidPhoneNumber(phone)
      ? 'Enter a valid phone number with country code.'
      : null

  function reset() {
    setName('')
    setKind('collector')
    setEmail('')
    setPhone('')
    setCity('')
    setNotes('')
    setError(null)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (emailError || phoneError) return
    setSubmitting(true)
    setError(null)
    try {
      await createCustomer({
        data: { name, kind, email, phone, city, notes },
      })
      await router.invalidate()
      reset()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader className="border-hairline border-b">
          <p className="kicker">New entry</p>
          <SheetTitle className="font-serif text-ink text-3xl font-normal italic">
            Add customer
          </SheetTitle>
          <SheetDescription>
            A name for the ledger. Email and city are optional.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-5 px-4 py-2">
          <Field label="Name" htmlFor="customer-name" required>
            <Input
              id="customer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </Field>

          <Field label="Kind" htmlFor="customer-kind">
            <Select value={kind} onValueChange={(v) => setKind(v as CustomerKind)}>
              <SelectTrigger id="customer-kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {customerKinds.map((k) => (
                  <SelectItem key={k} value={k}>
                    {kindLabel[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Email" htmlFor="customer-email">
            <Input
              id="customer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? 'customer-email-error' : undefined}
            />
            {emailError ? (
              <p
                id="customer-email-error"
                className="text-destructive text-xs"
              >
                {emailError}
              </p>
            ) : null}
          </Field>

          <Field label="Phone" htmlFor="customer-phone">
            <PhoneInput
              id="customer-phone"
              international
              defaultCountry="CZ"
              value={phone}
              onChange={(v) => setPhone(v ?? '')}
              inputComponent={Input}
              numberInputProps={{
                'aria-invalid': phoneError ? true : undefined,
                'aria-describedby': phoneError
                  ? 'customer-phone-error'
                  : undefined,
              }}
              className="phone-field"
            />
            {phoneError ? (
              <p
                id="customer-phone-error"
                className="text-destructive text-xs"
              >
                {phoneError}
              </p>
            ) : null}
          </Field>

          <Field label="City" htmlFor="customer-city">
            <Input
              id="customer-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </Field>

          <Field label="Notes" htmlFor="customer-notes">
            <Textarea
              id="customer-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </Field>

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}

          <SheetFooter className="border-hairline mt-auto border-t px-0">
            <div className="flex w-full justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !!emailError || !!phoneError}
              >
                {submitting ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="kicker">
        {label}
        {required ? <span className="text-safelight ml-1">*</span> : null}
      </Label>
      {children}
    </div>
  )
}
