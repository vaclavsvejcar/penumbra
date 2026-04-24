import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Input } from '#/components/ui/input'
import {
  FieldWrap,
  LookupArchiveConfirm,
  LookupFormActions,
  LookupHeader,
  LookupList,
  LookupRowActions,
  LookupSearch,
  parseFocusSearch,
  useLookupAdmin,
} from '#/components/lookup'
import type { CustomerType } from '#/db/schema'
import { cn } from '#/lib/utils'
import {
  archiveCustomerType,
  createCustomerType,
  listAllCustomerTypes,
  unarchiveCustomerType,
  updateCustomerType,
} from '#/server/customerTypes'

export const Route = createFileRoute('/lookups/customer-types')({
  component: CustomerTypesAdmin,
  validateSearch: parseFocusSearch,
  loader: () => listAllCustomerTypes(),
})

const fade = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

function CustomerTypesAdmin() {
  const rows = Route.useLoaderData()
  const { focus } = Route.useSearch()
  const admin = useLookupAdmin({
    rows,
    matchesQuery: (r, q) =>
      r.label.toLowerCase().includes(q) || r.code.toLowerCase().includes(q),
    archiveFn: archiveCustomerType,
    unarchiveFn: unarchiveCustomerType,
  })

  return (
    <motion.div initial="hidden" animate="visible" variants={fade}>
      <LookupHeader
        title="Customer types"
        description="Displayed when creating or editing a customer. Archived types stay on existing customers but disappear from selection lists."
        addLabel="Add type"
        onAdd={admin.startCreating}
        addDisabled={admin.creating || admin.busy}
      />

      {admin.error ? (
        <p className="text-destructive mb-4 text-sm" role="alert">
          {admin.error}
        </p>
      ) : null}

      <LookupSearch
        value={admin.query}
        onChange={admin.setQuery}
        placeholder="Find a type…"
        total={rows.length}
        filtered={admin.filtered.length}
      />

      <LookupList
        rows={admin.filtered}
        totalRows={rows.length}
        query={admin.query}
        onClearQuery={admin.clearQuery}
        creating={admin.creating}
        editingId={admin.editingId}
        emptyMessage="No customer types defined yet."
        focusId={focus}
        renderNewRow={() => (
          <NewTypeRow
            existingOrders={rows.map((r) => r.sortOrder)}
            onCancel={admin.cancelCreating}
            onSaved={admin.reloadAfterSave}
            onError={admin.setError}
          />
        )}
        renderEditRow={(t) => (
          <EditTypeRow
            type={t}
            onCancel={admin.cancelEditing}
            onSaved={admin.reloadAfterSave}
            onError={admin.setError}
          />
        )}
        renderDisplayRow={(t) => (
          <DisplayRow
            type={t}
            busy={admin.busy}
            onEdit={() => admin.startEditing(t.id)}
            onArchive={() => admin.requestArchive(t.id, t.label)}
            onUnarchive={() => admin.handleUnarchive(t.id)}
          />
        )}
      />

      <LookupArchiveConfirm
        pending={admin.pendingArchive}
        entityLabel="customer type"
        onCancel={admin.cancelArchive}
        onConfirm={admin.confirmArchive}
      />
    </motion.div>
  )
}

function DisplayRow({
  type,
  busy,
  onEdit,
  onArchive,
  onUnarchive,
}: {
  type: CustomerType
  busy: boolean
  onEdit: () => void
  onArchive: () => void
  onUnarchive: () => void
}) {
  const archived = type.archivedAt !== null
  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_auto_3rem_auto_auto] items-center gap-4 py-3.5 sm:gap-6',
        archived && 'opacity-55',
      )}
    >
      <div className="min-w-0">
        <p className="text-ink truncate text-sm font-medium">{type.label}</p>
        <p className="text-ink-muted truncate font-mono text-xs tabular-nums">
          {type.code}
        </p>
      </div>
      {archived ? (
        <Badge
          variant="outline"
          className="text-ink-muted font-normal normal-case tracking-normal"
        >
          Archived
        </Badge>
      ) : (
        <span />
      )}
      <span className="text-ink-muted text-right font-mono text-xs tabular-nums">
        {type.sortOrder}
      </span>
      <LookupRowActions
        label={type.label}
        archived={archived}
        busy={busy}
        onEdit={onEdit}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
      />
    </div>
  )
}

function NewTypeRow({
  existingOrders,
  onCancel,
  onSaved,
  onError,
}: {
  existingOrders: number[]
  onCancel: () => void
  onSaved: () => void | Promise<void>
  onError: (msg: string) => void
}) {
  const nextOrder =
    existingOrders.length === 0 ? 0 : Math.max(...existingOrders) + 1
  const [label, setLabel] = useState('')
  const [code, setCode] = useState('')
  const [sortOrder, setSortOrder] = useState(nextOrder)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!label.trim()) return
    setSaving(true)
    try {
      await createCustomerType({
        data: { label, code: code.trim() || undefined, sortOrder },
      })
      await onSaved()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not create type.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormRow
      label={label}
      setLabel={setLabel}
      code={code}
      setCode={setCode}
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      saving={saving}
      onCancel={onCancel}
      onSave={save}
      submitLabel="Add"
    />
  )
}

function EditTypeRow({
  type,
  onCancel,
  onSaved,
  onError,
}: {
  type: CustomerType
  onCancel: () => void
  onSaved: () => void | Promise<void>
  onError: (msg: string) => void
}) {
  const [label, setLabel] = useState(type.label)
  const [code, setCode] = useState(type.code)
  const [sortOrder, setSortOrder] = useState(type.sortOrder)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!label.trim()) return
    setSaving(true)
    try {
      await updateCustomerType({
        data: { id: type.id, label, code, sortOrder },
      })
      await onSaved()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save type.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormRow
      label={label}
      setLabel={setLabel}
      code={code}
      setCode={setCode}
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      saving={saving}
      onCancel={onCancel}
      onSave={save}
      submitLabel="Save"
    />
  )
}

function FormRow({
  label,
  setLabel,
  code,
  setCode,
  sortOrder,
  setSortOrder,
  saving,
  onCancel,
  onSave,
  submitLabel,
}: {
  label: string
  setLabel: (v: string) => void
  code: string
  setCode: (v: string) => void
  sortOrder: number
  setSortOrder: (v: number) => void
  saving: boolean
  onCancel: () => void
  onSave: () => void
  submitLabel: string
}) {
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 py-3 sm:gap-4">
      <div className="grid flex-1 grid-cols-[1fr_1fr_6rem] items-end gap-3 sm:gap-4">
        <FieldWrap htmlFor="ct-label" label="Label">
          <Input
            id="ct-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            autoFocus
            onKeyDown={onKeyDown}
          />
        </FieldWrap>
        <FieldWrap htmlFor="ct-code" label="Code">
          <Input
            id="ct-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="auto from label"
            className="font-mono text-xs"
            onKeyDown={onKeyDown}
          />
        </FieldWrap>
        <FieldWrap htmlFor="ct-sort" label="Sort">
          <Input
            id="ct-sort"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="font-mono tabular-nums"
            onKeyDown={onKeyDown}
          />
        </FieldWrap>
      </div>
      <LookupFormActions
        saving={saving}
        onCancel={onCancel}
        onSave={onSave}
        submitLabel={submitLabel}
        canSubmit={!!label.trim()}
      />
    </div>
  )
}
