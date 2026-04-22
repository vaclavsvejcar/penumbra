import { createFileRoute, useRouter } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Archive, Check, Pencil, Plus, RotateCcw, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { LookupSearch } from '#/components/LookupSearch'
import type { Manufacturer } from '#/db/schema'
import { cn } from '#/lib/utils'
import {
  archiveManufacturer,
  createManufacturer,
  listAllManufacturers,
  unarchiveManufacturer,
  updateManufacturer,
} from '#/server/manufacturers'

export const Route = createFileRoute('/settings/manufacturers')({
  component: ManufacturersAdmin,
  loader: () => listAllManufacturers(),
})

const item = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

function ManufacturersAdmin() {
  const rows = Route.useLoaderData()
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q) {
      return rows.filter(
        (r) =>
          r.label.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q),
      )
    }
    return rows.filter((r) => r.archivedAt === null)
  }, [rows, query])

  async function handleArchive(id: number) {
    setBusy(true)
    setError(null)
    try {
      await archiveManufacturer({ data: id })
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archive failed.')
    } finally {
      setBusy(false)
    }
  }

  async function handleUnarchive(id: number) {
    setBusy(true)
    setError(null)
    try {
      await unarchiveManufacturer({ data: id })
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={item}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="kicker mb-1.5">Lookup</p>
          <h2 className="font-serif text-ink text-2xl leading-tight italic">
            Manufacturers
          </h2>
          <p className="text-ink-soft mt-2 max-w-xl text-sm leading-relaxed">
            Brands of film, paper, and chemistry. Shared across the whole
            archive — a manufacturer like Kodak appears wherever it's offered.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCreating(true)
            setEditingId(null)
          }}
          disabled={creating || busy}
          className="shrink-0"
        >
          <Plus aria-hidden className="size-4" />
          Add manufacturer
        </Button>
      </div>

      {error ? (
        <p className="text-destructive mb-4 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <LookupSearch
        value={query}
        onChange={setQuery}
        placeholder="Find a manufacturer…"
        total={rows.length}
        filtered={filtered.length}
      />

      <ul>
        {creating ? (
          <li className="border-hairline bg-muted/20 border-b">
            <NewRow
              existingOrders={rows.map((r) => r.sortOrder)}
              onCancel={() => setCreating(false)}
              onSaved={async () => {
                setCreating(false)
                await router.invalidate()
              }}
              onError={setError}
            />
          </li>
        ) : null}
        {rows.length === 0 && !creating ? (
          <li className="border-hairline border-b py-12 text-center">
            <p className="kicker text-ink-muted mb-1">Empty list</p>
            <p className="text-ink-soft font-serif italic">
              No manufacturers defined yet.
            </p>
          </li>
        ) : filtered.length === 0 && !creating ? (
          <li className="border-hairline border-b py-12 text-center">
            <p className="kicker text-ink-muted mb-1">No matches</p>
            <p className="text-ink-soft font-serif italic">
              Nothing found for “{query.trim()}”.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery('')}
              className="mt-3"
            >
              Clear search
            </Button>
          </li>
        ) : null}
        {filtered.map((m) =>
          editingId === m.id ? (
            <li
              key={m.id}
              className="border-hairline bg-muted/20 border-b"
            >
              <EditRow
                manufacturer={m}
                onCancel={() => setEditingId(null)}
                onSaved={async () => {
                  setEditingId(null)
                  await router.invalidate()
                }}
                onError={setError}
              />
            </li>
          ) : (
            <li key={m.id} className="border-hairline border-b">
              <DisplayRow
                manufacturer={m}
                busy={busy}
                onEdit={() => {
                  setEditingId(m.id)
                  setCreating(false)
                }}
                onArchive={() => handleArchive(m.id)}
                onUnarchive={() => handleUnarchive(m.id)}
              />
            </li>
          ),
        )}
      </ul>
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
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        disabled={busy}
        aria-label={`Edit ${manufacturer.label}`}
      >
        <Pencil aria-hidden className="size-3.5" />
      </Button>
      {archived ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onUnarchive}
          disabled={busy}
          aria-label={`Restore ${manufacturer.label}`}
        >
          <RotateCcw aria-hidden className="size-3.5" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={onArchive}
          disabled={busy}
          aria-label={`Archive ${manufacturer.label}`}
        >
          <Archive aria-hidden className="size-3.5" />
        </Button>
      )}
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
  return (
    <div className="grid grid-cols-[1fr_1fr_6rem_auto_auto] items-end gap-3 py-3 sm:gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mfg-label" className="kicker">
          Label
        </Label>
        <Input
          id="mfg-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSave()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              onCancel()
            }
          }}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mfg-code" className="kicker">
          Code
        </Label>
        <Input
          id="mfg-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="auto from label"
          className="font-mono text-xs"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mfg-sort" className="kicker">
          Sort
        </Label>
        <Input
          id="mfg-sort"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          className="font-mono tabular-nums"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onSave}
        disabled={saving || !label.trim()}
        aria-label={submitLabel}
      >
        <Check aria-hidden className="size-3.5" />
        <span>{submitLabel}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        disabled={saving}
        aria-label="Cancel"
      >
        <X aria-hidden className="size-3.5" />
      </Button>
    </div>
  )
}
