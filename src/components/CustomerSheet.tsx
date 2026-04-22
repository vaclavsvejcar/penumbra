import { useRouter } from '@tanstack/react-router'
import { Check, Plus, X } from 'lucide-react'
import { useState } from 'react'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Textarea } from '#/components/ui/textarea'
import type { Customer, CustomerType, CustomerWithType } from '#/db/schema'
import { isValidEmail } from '#/lib/validation'
import { createCustomer, updateCustomer } from '#/server/customers'
import { createCustomerType } from '#/server/customerTypes'

const NEW_TYPE_VALUE = '__new_customer_type__'

type CustomerSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer | CustomerWithType
  customerTypes: CustomerType[]
}

export function CustomerSheet({
  open,
  onOpenChange,
  customer,
  customerTypes: initialTypes,
}: CustomerSheetProps) {
  const isEdit = !!customer
  const router = useRouter()

  const defaultTypeId =
    customer?.customerTypeId ?? initialTypes[0]?.id ?? null

  const [types, setTypes] = useState<CustomerType[]>(initialTypes)
  const [name, setName] = useState(customer?.name ?? '')
  const [customerTypeId, setCustomerTypeId] = useState<number | null>(
    defaultTypeId,
  )
  const [email, setEmail] = useState(customer?.email ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [city, setCity] = useState(customer?.city ?? '')
  const [notes, setNotes] = useState(customer?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [addingType, setAddingType] = useState(false)
  const [newTypeLabel, setNewTypeLabel] = useState('')
  const [creatingType, setCreatingType] = useState(false)
  const [typeError, setTypeError] = useState<string | null>(null)

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
    setCustomerTypeId(defaultTypeId)
    setEmail(customer?.email ?? '')
    setPhone(customer?.phone ?? '')
    setCity(customer?.city ?? '')
    setNotes(customer?.notes ?? '')
    setAddingType(false)
    setNewTypeLabel('')
    setTypeError(null)
    setError(null)
  }

  function onTypeChange(value: string) {
    if (value === NEW_TYPE_VALUE) {
      setAddingType(true)
      setNewTypeLabel('')
      setTypeError(null)
      return
    }
    const id = Number(value)
    if (Number.isInteger(id) && id > 0) setCustomerTypeId(id)
  }

  async function onAddType() {
    const label = newTypeLabel.trim()
    if (!label) {
      setTypeError('Label is required.')
      return
    }
    setCreatingType(true)
    setTypeError(null)
    try {
      const created = await createCustomerType({ data: { label } })
      setTypes((prev) => [...prev, created])
      setCustomerTypeId(created.id)
      setAddingType(false)
      setNewTypeLabel('')
    } catch (err) {
      setTypeError(err instanceof Error ? err.message : 'Could not add type.')
    } finally {
      setCreatingType(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (customerTypeId === null) {
      setError('Pick a customer type.')
      return
    }
    if (emailError || phoneError) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = { name, customerTypeId, email, phone, city, notes }
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

          <Field label="Type" htmlFor="customer-type" required>
            {addingType ? (
              <div className="flex items-center gap-2">
                <Input
                  id="customer-type-new"
                  value={newTypeLabel}
                  onChange={(e) => setNewTypeLabel(e.target.value)}
                  placeholder="e.g. Museum"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void onAddType()
                    } else if (e.key === 'Escape') {
                      e.preventDefault()
                      setAddingType(false)
                      setTypeError(null)
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onAddType}
                  disabled={creatingType || !newTypeLabel.trim()}
                  aria-label="Save type"
                >
                  <Check aria-hidden className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAddingType(false)
                    setTypeError(null)
                  }}
                  disabled={creatingType}
                  aria-label="Cancel"
                >
                  <X aria-hidden className="size-4" />
                </Button>
              </div>
            ) : (
              <Select
                value={customerTypeId ? String(customerTypeId) : undefined}
                onValueChange={onTypeChange}
              >
                <SelectTrigger id="customer-type" className="w-full">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.label}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value={NEW_TYPE_VALUE}>
                    <Plus aria-hidden className="size-3.5" />
                    Add new type…
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            {typeError ? (
              <p className="text-destructive text-xs">{typeError}</p>
            ) : null}
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
                disabled={
                  submitting ||
                  !!emailError ||
                  !!phoneError ||
                  customerTypeId === null ||
                  addingType
                }
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
