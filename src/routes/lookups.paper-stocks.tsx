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
  parseFocusSearch,
  useLookupAdmin,
} from '#/components/lookup'
import {
  paperBases,
  paperContrasts,
  paperTones,
  type Manufacturer,
  type PaperBase,
  type PaperContrast,
  type PaperStockWithManufacturer,
  type PaperTone,
} from '#/db/schema'
import { cn } from '#/lib/utils'
import { listManufacturers } from '#/server/manufacturers'
import {
  archivePaperStock,
  createPaperStock,
  listAllPaperStocks,
  unarchivePaperStock,
  updatePaperStock,
} from '#/server/paperStocks'

export const Route = createFileRoute('/lookups/paper-stocks')({
  component: PaperStocksAdmin,
  validateSearch: parseFocusSearch,
  loader: async () => ({
    stocks: await listAllPaperStocks(),
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

const baseLabels: Record<PaperBase, string> = {
  rc: 'RC',
  fb: 'FB',
}

const toneLabels: Record<PaperTone, string> = {
  neutral: 'Neutral',
  warm: 'Warm',
  cool: 'Cool',
}

const contrastLabels: Record<PaperContrast, string> = {
  variable: 'Variable',
  graded: 'Graded',
}

function contrastDisplay(stock: PaperStockWithManufacturer): string {
  if (stock.contrast === 'graded') {
    return stock.grade !== null ? `Graded ${stock.grade}` : 'Graded'
  }
  return 'Variable'
}

function PaperStocksAdmin() {
  const { stocks, manufacturers } = Route.useLoaderData()
  const { focus } = Route.useSearch()
  const admin = useLookupAdmin({
    rows: stocks,
    matchesQuery: (s, q) =>
      s.label.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.manufacturer.label.toLowerCase().includes(q),
    archiveFn: archivePaperStock,
    unarchiveFn: unarchivePaperStock,
  })

  const canCreate = manufacturers.length > 0

  return (
    <motion.div initial="hidden" animate="visible" variants={fade}>
      <LookupHeader
        title="Paper stocks"
        description="Darkroom papers. Each stock lives under one manufacturer and records its base, tone, and whether it's variable-contrast or graded."
        addLabel="Add paper"
        onAdd={admin.startCreating}
        addDisabled={admin.creating || admin.busy || !canCreate}
      />

      {!canCreate ? (
        <p className="text-ink-soft mb-4 text-sm">
          Add at least one manufacturer in the Manufacturers tab before
          creating a paper stock.
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
        placeholder="Find a paper…"
        total={stocks.length}
        filtered={admin.filtered.length}
      />

      <LookupList
        rows={admin.filtered}
        totalRows={stocks.length}
        query={admin.query}
        onClearQuery={admin.clearQuery}
        creating={admin.creating}
        editingId={admin.editingId}
        emptyMessage="No paper stocks defined yet."
        focusId={focus}
        renderNewRow={() => (
          <NewRow
            manufacturers={manufacturers}
            existingOrders={stocks.map((s) => s.sortOrder)}
            onCancel={admin.cancelCreating}
            onSaved={admin.reloadAfterSave}
            onError={admin.setError}
          />
        )}
        renderEditRow={(s) => (
          <EditRow
            stock={s}
            manufacturers={manufacturers}
            onCancel={admin.cancelEditing}
            onSaved={admin.reloadAfterSave}
            onError={admin.setError}
          />
        )}
        renderDisplayRow={(s) => (
          <DisplayRow
            stock={s}
            busy={admin.busy}
            onEdit={() => admin.startEditing(s.id)}
            onArchive={() => admin.handleArchive(s.id)}
            onUnarchive={() => admin.handleUnarchive(s.id)}
          />
        )}
      />
    </motion.div>
  )
}

function DisplayRow({
  stock,
  busy,
  onEdit,
  onArchive,
  onUnarchive,
}: {
  stock: PaperStockWithManufacturer
  busy: boolean
  onEdit: () => void
  onArchive: () => void
  onUnarchive: () => void
}) {
  const archived = stock.archivedAt !== null
  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_3.5rem_5rem_6rem_2.5rem_auto_auto] items-center gap-3 py-3.5 sm:gap-5',
        archived && 'opacity-55',
      )}
    >
      <div className="min-w-0">
        <p className="text-ink truncate text-sm font-medium">{stock.label}</p>
        <p className="text-ink-muted truncate text-xs">
          <span>{stock.manufacturer.label}</span>
          <span className="mx-1.5">·</span>
          <span className="font-mono tabular-nums">{stock.code}</span>
        </p>
      </div>
      <Badge
        variant="outline"
        className="text-ink-soft font-normal normal-case tracking-normal"
      >
        {baseLabels[stock.base]}
      </Badge>
      <Badge
        variant="outline"
        className="text-ink-soft font-normal normal-case tracking-normal"
      >
        {toneLabels[stock.tone]}
      </Badge>
      <Badge
        variant="outline"
        className="text-ink-soft font-normal normal-case tracking-normal"
      >
        {contrastDisplay(stock)}
      </Badge>
      <span className="text-ink-muted text-right font-mono text-xs tabular-nums">
        {stock.sortOrder}
      </span>
      <LookupRowActions
        label={stock.label}
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
  base: PaperBase
  tone: PaperTone
  contrast: PaperContrast
  grade: number
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
    base: 'rc',
    tone: 'neutral',
    contrast: 'variable',
    grade: 2,
    sortOrder: nextOrder,
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!state.label.trim() || state.manufacturerId === null) return
    setSaving(true)
    try {
      await createPaperStock({
        data: {
          label: state.label,
          code: state.code.trim() || undefined,
          manufacturerId: state.manufacturerId,
          base: state.base,
          tone: state.tone,
          contrast: state.contrast,
          grade: state.contrast === 'graded' ? state.grade : null,
          sortOrder: state.sortOrder,
        },
      })
      await onSaved()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not create paper.')
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
  stock,
  manufacturers,
  onCancel,
  onSaved,
  onError,
}: {
  stock: PaperStockWithManufacturer
  manufacturers: Manufacturer[]
  onCancel: () => void
  onSaved: () => void | Promise<void>
  onError: (msg: string) => void
}) {
  const [state, setState] = useState<FormState>({
    label: stock.label,
    code: stock.code,
    manufacturerId: stock.manufacturerId,
    base: stock.base,
    tone: stock.tone,
    contrast: stock.contrast,
    grade: stock.grade ?? 2,
    sortOrder: stock.sortOrder,
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!state.label.trim() || state.manufacturerId === null) return
    setSaving(true)
    try {
      await updatePaperStock({
        data: {
          id: stock.id,
          label: state.label,
          code: state.code,
          manufacturerId: state.manufacturerId,
          base: state.base,
          tone: state.tone,
          contrast: state.contrast,
          grade: state.contrast === 'graded' ? state.grade : null,
          sortOrder: state.sortOrder,
        },
      })
      await onSaved()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save paper.')
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

  const isGraded = state.contrast === 'graded'

  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="grid grid-cols-[9rem_1fr_10rem] items-end gap-3 sm:gap-4">
        <FieldWrap htmlFor="ps-mfg" label="Manufacturer">
          <Select
            value={state.manufacturerId ? String(state.manufacturerId) : ''}
            onValueChange={(v) => update('manufacturerId', Number(v))}
          >
            <SelectTrigger id="ps-mfg" className="w-full">
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
        <FieldWrap htmlFor="ps-label" label="Label">
          <Input
            id="ps-label"
            value={state.label}
            onChange={(e) => update('label', e.target.value)}
            autoFocus
            onKeyDown={onKeyDown}
          />
        </FieldWrap>
        <FieldWrap htmlFor="ps-code" label="Code">
          <Input
            id="ps-code"
            value={state.code}
            onChange={(e) => update('code', e.target.value)}
            placeholder="auto from label"
            className="font-mono text-xs"
            onKeyDown={onKeyDown}
          />
        </FieldWrap>
      </div>
      <div className="flex flex-wrap items-end gap-3 sm:gap-4">
        <div className="grid grid-cols-[5rem_6.5rem_7rem_5rem_5rem] items-end gap-3 sm:gap-4">
          <FieldWrap htmlFor="ps-base" label="Base">
            <Select
              value={state.base}
              onValueChange={(v) => update('base', v as PaperBase)}
            >
              <SelectTrigger id="ps-base" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paperBases.map((b) => (
                  <SelectItem key={b} value={b}>
                    {baseLabels[b]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrap>
          <FieldWrap htmlFor="ps-tone" label="Tone">
            <Select
              value={state.tone}
              onValueChange={(v) => update('tone', v as PaperTone)}
            >
              <SelectTrigger id="ps-tone" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paperTones.map((t) => (
                  <SelectItem key={t} value={t}>
                    {toneLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrap>
          <FieldWrap htmlFor="ps-contrast" label="Contrast">
            <Select
              value={state.contrast}
              onValueChange={(v) => update('contrast', v as PaperContrast)}
            >
              <SelectTrigger id="ps-contrast" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paperContrasts.map((c) => (
                  <SelectItem key={c} value={c}>
                    {contrastLabels[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrap>
          <FieldWrap htmlFor="ps-grade" label="Grade">
            <Input
              id="ps-grade"
              type="number"
              min={0}
              max={5}
              step={1}
              value={state.grade}
              onChange={(e) => update('grade', Number(e.target.value))}
              className="font-mono tabular-nums"
              disabled={!isGraded}
              onKeyDown={onKeyDown}
            />
          </FieldWrap>
          <FieldWrap htmlFor="ps-sort" label="Sort">
            <Input
              id="ps-sort"
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
