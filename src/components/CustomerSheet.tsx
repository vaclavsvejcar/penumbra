import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
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
import { createCustomer, updateCustomer } from '#/server/customers'

const kindLabel: Record<CustomerKind, string> = {
  collector: 'Collector',
  gallery: 'Gallery',
}

type CustomerSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer
}

export function CustomerSheet({
  open,
  onOpenChange,
  customer,
}: CustomerSheetProps) {
  const isEdit = !!customer
  const router = useRouter()

  const [name, setName] = useState(customer?.name ?? '')
  const [kind, setKind] = useState<CustomerKind>(customer?.kind ?? 'collector')
  const [email, setEmail] = useState(customer?.email ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [city, setCity] = useState(customer?.city ?? '')
  const [notes, setNotes] = useState(customer?.notes ?? '')
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

  function resetToInitial() {
    setName(customer?.name ?? '')
    setKind(customer?.kind ?? 'collector')
    setEmail(customer?.email ?? '')
    setPhone(customer?.phone ?? '')
    setCity(customer?.city ?? '')
    setNotes(customer?.notes ?? '')
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
      const payload = { name, kind, email, phone, city, notes }
      if (isEdit) {
        await updateCustomer({ data: { id: customer.id, ...payload } })
      } else {
        await createCustomer({ data: payload })
      }
      await router.invalidate()
      onOpenChange(false)
      if (!isEdit) resetToInitial()
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
        if (!next) resetToInitial()
        onOpenChange(next)
      }}
    >
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader className="border-hairline border-b">
          <p className="kicker">{isEdit ? 'Edit entry' : 'New entry'}</p>
          <SheetTitle className="font-serif text-ink text-3xl font-normal italic">
            {isEdit ? 'Edit customer' : 'Add customer'}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update the details for this customer.'
              : 'A name for the ledger. Email and city are optional.'}
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
                {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Save'}
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
