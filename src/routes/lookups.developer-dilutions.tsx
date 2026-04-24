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
  LookupArchiveConfirm,
  LookupFormActions,
  LookupHeader,
  LookupList,
  LookupRowActions,
  LookupSearch,
  parseFocusSearch,
  useLookupAdmin,
} from '#/components/lookup'
import type {
  DeveloperDilutionWithDeveloper,
  DeveloperWithManufacturer,
} from '#/db/schema'
import { cn } from '#/lib/utils'
import { listAllDevelopers } from '#/server/developers'
import {
  archiveDeveloperDilution,
  createDeveloperDilution,
  listAllDeveloperDilutions,
  unarchiveDeveloperDilution,
  updateDeveloperDilution,
} from '#/server/developerDilutions'

export const Route = createFileRoute('/lookups/developer-dilutions')({
  component: DeveloperDilutionsAdmin,
  validateSearch: parseFocusSearch,
  loader: async () => ({
    dilutions: await listAllDeveloperDilutions(),
    developers: await listAllDevelopers(),
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

function DeveloperDilutionsAdmin() {
  const { dilutions, developers } = Route.useLoaderData()
  const { focus } = Route.useSearch()
  const admin = useLookupAdmin({
    rows: dilutions,
    matchesQuery: (d, q) =>
      d.label.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.developer.label.toLowerCase().includes(q) ||
      d.developer.manufacturer.label.toLowerCase().includes(q),
    archiveFn: archiveDeveloperDilution,
    unarchiveFn: unarchiveDeveloperDilution,
  })

  const activeDevelopers = developers.filter((d) => d.archivedAt === null)
  const canCreate = activeDevelopers.length > 0

  return (
    <motion.div initial="hidden" animate="visible" variants={fade}>
      <LookupHeader
        title="Developer dilutions"
        description="Standard dilutions per developer (e.g., Rodinal 1+50, HC-110 B). Pickable on the negative form."
        addLabel="Add dilution"
        onAdd={admin.startCreating}
        addDisabled={admin.creating || admin.busy || !canCreate}
      />

      {!canCreate ? (
        <p className="text-ink-soft mb-4 text-sm">
          Add at least one developer in the Developers tab before creating a
          dilution.
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
        placeholder="Find a dilution…"
        total={dilutions.length}
        filtered={admin.filtered.length}
      />

      <LookupList
        rows={admin.filtered}
        totalRows={dilutions.length}
        query={admin.query}
        onClearQuery={admin.clearQuery}
        creating={admin.creating}
        editingId={admin.editingId}
        emptyMessage="No dilutions defined yet."
        focusId={focus}
        renderNewRow={() => (
          <NewRow
            developers={activeDevelopers}
            existingRows={dilutions}
            onCancel={admin.cancelCreating}
            onSaved={admin.reloadAfterSave}
            onError={admin.setError}
          />
        )}
        renderEditRow={(d) => (
          <EditRow
            dilution={d}
            developers={activeDevelopers}
            onCancel={admin.cancelEditing}
            onSaved={admin.reloadAfterSave}
            onError={admin.setError}
          />
        )}
        renderDisplayRow={(d) => (
          <DisplayRow
            dilution={d}
            busy={admin.busy}
            onEdit={() => admin.startEditing(d.id)}
            onArchive={() => admin.requestArchive(d.id, d.label)}
            onUnarchive={() => admin.handleUnarchive(d.id)}
          />
        )}
      />

      <LookupArchiveConfirm
        pending={admin.pendingArchive}
        entityLabel="dilution"
        onCancel={admin.cancelArchive}
        onConfirm={admin.confirmArchive}
      />
    </motion.div>
  )
}

function DisplayRow({
  dilution,
  busy,
  onEdit,
  onArchive,
  onUnarchive,
}: {
  dilution: DeveloperDilutionWithDeveloper
  busy: boolean
  onEdit: () => void
  onArchive: () => void
  onUnarchive: () => void
}) {
  const archived = dilution.archivedAt !== null
  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_2.5rem_auto] items-center gap-3 py-3.5 sm:gap-5',
        archived && 'opacity-55',
      )}
    >
      <div className="min-w-0">
        <p className="text-ink truncate text-sm font-medium">
          {dilution.label}
        </p>
        <p className="text-ink-muted truncate text-xs">
          <span>
            {dilution.developer.manufacturer.label}{' '}
            {dilution.developer.label}
          </span>
          <span className="mx-1.5">·</span>
          <span className="font-mono tabular-nums">{dilution.code}</span>
        </p>
      </div>
      <span className="text-ink-muted text-right font-mono text-xs tabular-nums">
        {dilution.sortOrder}
      </span>
      <LookupRowActions
        label={dilution.label}
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
  developerId: number | null
  sortOrder: number
}

function NewRow({
  developers,
  existingRows,
  onCancel,
  onSaved,
  onError,
}: {
  developers: DeveloperWithManufacturer[]
  existingRows: DeveloperDilutionWithDeveloper[]
  onCancel: () => void
  onSaved: () => void | Promise<void>
  onError: (msg: string) => void
}) {
  const [state, setState] = useState<FormState>(() => {
    const defaultDev = developers[0]?.id ?? null
    const nextOrder = defaultDev
      ? Math.max(
          -1,
          ...existingRows
            .filter((r) => r.developerId === defaultDev)
            .map((r) => r.sortOrder),
        ) + 1
      : 0
    return {
      label: '',
      code: '',
      developerId: defaultDev,
      sortOrder: nextOrder,
    }
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!state.label.trim() || state.developerId === null) return
    setSaving(true)
    try {
      await createDeveloperDilution({
        data: {
          label: state.label,
          code: state.code.trim() || undefined,
          developerId: state.developerId,
          sortOrder: state.sortOrder,
        },
      })
      await onSaved()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not create dilution.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormRow
      state={state}
      setState={setState}
      developers={developers}
      existingRows={existingRows}
      saving={saving}
      onCancel={onCancel}
      onSave={save}
      submitLabel="Add"
    />
  )
}

function EditRow({
  dilution,
  developers,
  onCancel,
  onSaved,
  onError,
}: {
  dilution: DeveloperDilutionWithDeveloper
  developers: DeveloperWithManufacturer[]
  onCancel: () => void
  onSaved: () => void | Promise<void>
  onError: (msg: string) => void
}) {
  const [state, setState] = useState<FormState>({
    label: dilution.label,
    code: dilution.code,
    developerId: dilution.developerId,
    sortOrder: dilution.sortOrder,
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!state.label.trim() || state.developerId === null) return
    setSaving(true)
    try {
      await updateDeveloperDilution({
        data: {
          id: dilution.id,
          label: state.label,
          code: state.code,
          developerId: state.developerId,
          sortOrder: state.sortOrder,
        },
      })
      await onSaved()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save dilution.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormRow
      state={state}
      setState={setState}
      developers={developers}
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
  developers,
  saving,
  onCancel,
  onSave,
  submitLabel,
}: {
  state: FormState
  setState: (updater: (prev: FormState) => FormState) => void
  developers: DeveloperWithManufacturer[]
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
      <div className="grid grid-cols-[12rem_1fr_10rem] items-end gap-3 sm:gap-4">
        <FieldWrap htmlFor="dil-dev" label="Developer">
          <Select
            value={state.developerId ? String(state.developerId) : ''}
            onValueChange={(v) => update('developerId', Number(v))}
          >
            <SelectTrigger id="dil-dev" className="w-full">
              <SelectValue placeholder="Pick one" />
            </SelectTrigger>
            <SelectContent>
              {developers.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.manufacturer.label} {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrap>
        <FieldWrap htmlFor="dil-label" label="Label">
          <Input
            id="dil-label"
            value={state.label}
            onChange={(e) => update('label', e.target.value)}
            placeholder="e.g. 1+50 or B (1+31)"
            autoFocus
            onKeyDown={onKeyDown}
          />
        </FieldWrap>
        <FieldWrap htmlFor="dil-code" label="Code">
          <Input
            id="dil-code"
            value={state.code}
            onChange={(e) => update('code', e.target.value)}
            placeholder="auto from label"
            className="font-mono text-xs"
            onKeyDown={onKeyDown}
          />
        </FieldWrap>
      </div>
      <div className="flex flex-wrap items-end gap-3 sm:gap-4">
        <div className="grid grid-cols-[5rem] items-end gap-3 sm:gap-4">
          <FieldWrap htmlFor="dil-sort" label="Sort">
            <Input
              id="dil-sort"
              type="number"
              value={state.sortOrder}
              onChange={(e) =>
                update('sortOrder', Number(e.target.value))
              }
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
          canSubmit={!!state.label.trim() && state.developerId !== null}
        />
      </div>
    </div>
  )
}

