import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Input } from '#/components/ui/input'
import {
  FieldWrap,
  LookupFormActions,
  LookupHeader,
  LookupList,
  LookupRowActions,
  LookupSearch,
  useLookupAdmin,
} from '#/components/lookup'
import type { Manufacturer } from '#/db/schema'
import { cn } from '#/lib/utils'
import {
  archiveManufacturer,
  createManufacturer,
  listAllManufacturers,
  unarchiveManufacturer,
  updateManufacturer,
} from '#/server/manufacturers'

export const Route = createFileRoute('/lookups/manufacturers')({
  component: ManufacturersAdmin,
  loader: () => listAllManufacturers(),
})

const fade = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

function ManufacturersAdmin() {
  const rows = Route.useLoaderData()
  const admin = useLookupAdmin({
    rows,
    matchesQuery: (r, q) =>
      r.label.toLowerCase().includes(q) || r.code.toLowerCase().includes(q),
    archiveFn: archiveManufacturer,
    unarchiveFn: unarchiveManufacturer,
  })

  return (
    <motion.div initial="hidden" animate="visible" variants={fade}>
      <LookupHeader
        title="Manufacturers"
        description="Brands of film, paper, and chemistry. Shared across the whole archive — a manufacturer like Kodak appears wherever it's offered."
        addLabel="Add manufacturer"
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
        placeholder="Find a manufacturer…"
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
        emptyMessage="No manufacturers defined yet."
        renderNewRow={() => (
          <NewRow
            existingOrders={rows.map((r) => r.sortOrder)}
            onCancel={admin.cancelCreating}
            onSaved={admin.reloadAfterSave}
            onError={admin.setError}
          />
        )}
        renderEditRow={(m) => (
          <EditRow
            manufacturer={m}
            onCancel={admin.cancelEditing}
            onSaved={admin.reloadAfterSave}
            onError={admin.setError}
          />
        )}
        renderDisplayRow={(m) => (
          <DisplayRow
            manufacturer={m}
            busy={admin.busy}
            onEdit={() => admin.startEditing(m.id)}
            onArchive={() => admin.handleArchive(m.id)}
            onUnarchive={() => admin.handleUnarchive(m.id)}
          />
        )}
      />
    </motion.div>
  )
}

function DisplayRow({
  manufacturer,
  busy,
  onEdit,
  onArchive,
  onUnarchive,
}: {
  manufacturer: Manufacturer
  busy: boolean
  onEdit: () => void
  onArchive: () => void
  onUnarchive: () => void
}) {
  const archived = manufacturer.archivedAt !== null
  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_auto_3rem_auto_auto] items-center gap-4 py-3.5 sm:gap-6',
        archived && 'opacity-55',
      )}
    >
      <div className="min-w-0">
        <p className="text-ink truncate text-sm font-medium">
          {manufacturer.label}
        </p>
        <p className="text-ink-muted truncate font-mono text-xs tabular-nums">
          {manufacturer.code}
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
        {manufacturer.sortOrder}
      </span>
      <LookupRowActions
        label={manufacturer.label}
        archived={archived}
        busy={busy}
        onEdit={onEdit}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
      />
    </div>
  )
}

function NewRow({
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
      await createManufacturer({
        data: { label, code: code.trim() || undefined, sortOrder },
      })
      await onSaved()
    } catch (err) {
      onError(
        err instanceof Error ? err.message : 'Could not create manufacturer.',
      )
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

function EditRow({
  manufacturer,
  onCancel,
  onSaved,
  onError,
}: {
  manufacturer: Manufacturer
  onCancel: () => void
  onSaved: () => void | Promise<void>
  onError: (msg: string) => void
}) {
  const [label, setLabel] = useState(manufacturer.label)
  const [code, setCode] = useState(manufacturer.code)
  const [sortOrder, setSortOrder] = useState(manufacturer.sortOrder)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!label.trim()) return
    setSaving(true)
    try {
      await updateManufacturer({
        data: { id: manufacturer.id, label, code, sortOrder },
      })
      await onSaved()
    } catch (err) {
      onError(
        err instanceof Error ? err.message : 'Could not save manufacturer.',
      )
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
        <FieldWrap htmlFor="mfg-label" label="Label">
          <Input
            id="mfg-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            autoFocus
            onKeyDown={onKeyDown}
          />
        </FieldWrap>
        <FieldWrap htmlFor="mfg-code" label="Code">
          <Input
            id="mfg-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="auto from label"
            className="font-mono text-xs"
            onKeyDown={onKeyDown}
          />
        </FieldWrap>
        <FieldWrap htmlFor="mfg-sort" label="Sort">
          <Input
            id="mfg-sort"
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
