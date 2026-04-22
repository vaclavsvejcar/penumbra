import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  FieldWrap,
  LookupFormActions,
  LookupHeader,
  LookupList,
  LookupRowActions,
  LookupSearch,
  useLookupAdmin,
} from '#/components/lookup'
import {
  developerApplies,
  developerForms,
  type DeveloperApplies,
  type DeveloperForm,
  type DeveloperWithManufacturer,
  type Manufacturer,
} from '#/db/schema'
import { cn } from '#/lib/utils'
import {
  archiveDeveloper,
  createDeveloper,
  listAllDevelopers,
  unarchiveDeveloper,
  updateDeveloper,
} from '#/server/developers'
import { listManufacturers } from '#/server/manufacturers'

export const Route = createFileRoute('/settings/developers')({
  component: DevelopersAdmin,
  loader: async () => ({
    developers: await listAllDevelopers(),
    manufacturers: await listManufacturers(),
  }),
})

const fade = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

const appliesLabels: Record<DeveloperApplies, string> = {
  film: 'Film',
  paper: 'Paper',
  both: 'Film + Paper',
}

const formLabels: Record<DeveloperForm, string> = {
  liquid: 'Liquid',
  powder: 'Powder',
  monobath: 'Monobath',
}

function DevelopersAdmin() {
  const { developers, manufacturers } = Route.useLoaderData()
  const admin = useLookupAdmin({
    rows: developers,
    matchesQuery: (d, q) =>
      d.label.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.manufacturer.label.toLowerCase().includes(q),
    archiveFn: archiveDeveloper,
    unarchiveFn: unarchiveDeveloper,
  })

  const canCreate = manufacturers.length > 0

  return (
    <motion.div initial="hidden" animate="visible" variants={fade}>
      <LookupHeader
        title="Developers"
        description="Chemistry for developing film and paper. Each developer records whether it's for film, paper, or both, and its physical form."
        addLabel="Add developer"
        onAdd={admin.startCreating}
        addDisabled={admin.creating || admin.busy || !canCreate}
      />

      {!canCreate ? (
        <p className="text-ink-soft mb-4 text-sm">
          Add at least one manufacturer in the Manufacturers tab before
          creating a developer.
        </p>
      ) : null}

      {admin.error ? (
        <p className="text-destructive mb-4 text-sm" role="alert">
          {admin.error}
        </p>
      ) : null}

      <LookupSearch
        value={admin.query}
        onChange={admin.setQuery}
        placeholder="Find a developer…"
        total={developers.length}
        filtered={admin.filtered.length}
      />

      <LookupList
        rows={admin.filtered}
        totalRows={developers.length}
        query={admin.query}
        onClearQuery={admin.clearQuery}
        creating={admin.creating}
        editingId={admin.editingId}
        emptyMessage="No developers defined yet."
        renderNewRow={() => (
          <NewRow
            manufacturers={manufacturers}
            existingOrders={developers.map((d) => d.sortOrder)}
            onCancel={admin.cancelCreating}
            onSaved={admin.reloadAfterSave}
            onError={admin.setError}
          />
        )}
        renderEditRow={(d) => (
          <EditRow
            developer={d}
            manufacturers={manufacturers}
            onCancel={admin.cancelEditing}
            onSaved={admin.reloadAfterSave}
            onError={admin.setError}
          />
        )}
        renderDisplayRow={(d) => (
          <DisplayRow
            developer={d}
            busy={admin.busy}
            onEdit={() => admin.startEditing(d.id)}
            onArchive={() => admin.handleArchive(d.id)}
            onUnarchive={() => admin.handleUnarchive(d.id)}
          />
        )}
      />
    </motion.div>
  )
}

function DisplayRow({
  developer,
  busy,
  onEdit,
  onArchive,
  onUnarchive,
}: {
  developer: DeveloperWithManufacturer
  busy: boolean
  onEdit: () => void
  onArchive: () => void
  onUnarchive: () => void
}) {
  const archived = developer.archivedAt !== null
  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_7rem_5.5rem_2.5rem_auto_auto] items-center gap-3 py-3.5 sm:gap-5',
        archived && 'opacity-55',
      )}
    >
      <div className="min-w-0">
        <p className="text-ink truncate text-sm font-medium">
          {developer.label}
        </p>
        <p className="text-ink-muted truncate text-xs">
          <span>{developer.manufacturer.label}</span>
          <span className="mx-1.5">·</span>
          <span className="font-mono tabular-nums">{developer.code}</span>
        </p>
      </div>
      <Badge
        variant="outline"
        className="text-ink-soft font-normal normal-case tracking-normal"
      >
        {appliesLabels[developer.appliesTo]}
      </Badge>
      <Badge
        variant="outline"
        className="text-ink-soft font-normal normal-case tracking-normal"
      >
        {formLabels[developer.form]}
      </Badge>
      <span className="text-ink-muted text-right font-mono text-xs tabular-nums">
        {developer.sortOrder}
      </span>
      <LookupRowActions
        label={developer.label}
        archived={archived}
        busy={busy}
        onEdit={onEdit}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
      />
    </div>
  )
}

type FormState = {
  label: string
  code: string
  manufacturerId: number | null
  appliesTo: DeveloperApplies
  form: DeveloperForm
  sortOrder: number
}

function NewRow({
  manufacturers,
  existingOrders,
  onCancel,
  onSaved,
  onError,
}: {
  manufacturers: Manufacturer[]
  existingOrders: number[]
  onCancel: () => void
  onSaved: () => void | Promise<void>
  onError: (msg: string) => void
}) {
  const nextOrder =
    existingOrders.length === 0 ? 0 : Math.max(...existingOrders) + 1
  const [state, setState] = useState<FormState>({
    label: '',
    code: '',
    manufacturerId: manufacturers[0]?.id ?? null,
    appliesTo: 'film',
    form: 'liquid',
    sortOrder: nextOrder,
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!state.label.trim() || state.manufacturerId === null) return
    setSaving(true)
    try {
      await createDeveloper({
        data: {
          label: state.label,
          code: state.code.trim() || undefined,
          manufacturerId: state.manufacturerId,
          appliesTo: state.appliesTo,
          form: state.form,
          sortOrder: state.sortOrder,
        },
      })
      await onSaved()
    } catch (err) {
      onError(
        err instanceof Error ? err.message : 'Could not create developer.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormRow
      state={state}
      setState={setState}
      manufacturers={manufacturers}
      saving={saving}
      onCancel={onCancel}
      onSave={save}
      submitLabel="Add"
    />
  )
}

function EditRow({
  developer,
  manufacturers,
  onCancel,
  onSaved,
  onError,
}: {
  developer: DeveloperWithManufacturer
  manufacturers: Manufacturer[]
  onCancel: () => void
  onSaved: () => void | Promise<void>
  onError: (msg: string) => void
}) {
  const [state, setState] = useState<FormState>({
    label: developer.label,
    code: developer.code,
    manufacturerId: developer.manufacturerId,
    appliesTo: developer.appliesTo,
    form: developer.form,
    sortOrder: developer.sortOrder,
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!state.label.trim() || state.manufacturerId === null) return
    setSaving(true)
    try {
      await updateDeveloper({
        data: {
          id: developer.id,
          label: state.label,
          code: state.code,
          manufacturerId: state.manufacturerId,
          appliesTo: state.appliesTo,
          form: state.form,
          sortOrder: state.sortOrder,
        },
      })
      await onSaved()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save developer.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormRow
      state={state}
      setState={setState}
      manufacturers={manufacturers}
      saving={saving}
      onCancel={onCancel}
      onSave={save}
      submitLabel="Save"
    />
  )
}

function FormRow({
  state,
  setState,
  manufacturers,
  saving,
  onCancel,
  onSave,
  submitLabel,
}: {
  state: FormState
  setState: (updater: (prev: FormState) => FormState) => void
  manufacturers: Manufacturer[]
  saving: boolean
  onCancel: () => void
  onSave: () => void
  submitLabel: string
}) {
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }))

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
    <div className="flex flex-col gap-3 py-3">
      <div className="grid grid-cols-[9rem_1fr_10rem] items-end gap-3 sm:gap-4">
        <FieldWrap htmlFor="dev-mfg" label="Manufacturer">
          <Select
            value={state.manufacturerId ? String(state.manufacturerId) : ''}
            onValueChange={(v) => update('manufacturerId', Number(v))}
          >
            <SelectTrigger id="dev-mfg" className="w-full">
              <SelectValue placeholder="Pick one" />
            </SelectTrigger>
            <SelectContent>
              {manufacturers.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrap>
        <FieldWrap htmlFor="dev-label" label="Label">
          <Input
            id="dev-label"
            value={state.label}
            onChange={(e) => update('label', e.target.value)}
            autoFocus
            onKeyDown={onKeyDown}
          />
        </FieldWrap>
        <FieldWrap htmlFor="dev-code" label="Code">
          <Input
            id="dev-code"
            value={state.code}
            onChange={(e) => update('code', e.target.value)}
            placeholder="auto from label"
            className="font-mono text-xs"
            onKeyDown={onKeyDown}
          />
        </FieldWrap>
      </div>
      <div className="flex flex-wrap items-end gap-3 sm:gap-4">
        <div className="grid grid-cols-[8rem_7rem_5rem] items-end gap-3 sm:gap-4">
          <FieldWrap htmlFor="dev-applies" label="Applies to">
            <Select
              value={state.appliesTo}
              onValueChange={(v) => update('appliesTo', v as DeveloperApplies)}
            >
              <SelectTrigger id="dev-applies" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {developerApplies.map((a) => (
                  <SelectItem key={a} value={a}>
                    {appliesLabels[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrap>
          <FieldWrap htmlFor="dev-form" label="Form">
            <Select
              value={state.form}
              onValueChange={(v) => update('form', v as DeveloperForm)}
            >
              <SelectTrigger id="dev-form" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {developerForms.map((f) => (
                  <SelectItem key={f} value={f}>
                    {formLabels[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrap>
          <FieldWrap htmlFor="dev-sort" label="Sort">
            <Input
              id="dev-sort"
              type="number"
              value={state.sortOrder}
              onChange={(e) => update('sortOrder', Number(e.target.value))}
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
          canSubmit={!!state.label.trim() && state.manufacturerId !== null}
        />
      </div>
    </div>
  )
}
