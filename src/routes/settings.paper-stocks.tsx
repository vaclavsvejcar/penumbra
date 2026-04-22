import { createFileRoute, useRouter } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Archive, Check, Pencil, Plus, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { LookupSearch } from '#/components/LookupSearch'
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

export const Route = createFileRoute('/settings/paper-stocks')({
  component: PaperStocksAdmin,
  loader: async () => ({
    stocks: await listAllPaperStocks(),
    manufacturers: await listManufacturers(),
  }),
})

const item = {
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

function PaperStocksAdmin() {
  const { stocks, manufacturers } = Route.useLoaderData()
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q) {
      return stocks.filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.manufacturer.label.toLowerCase().includes(q),
      )
    }
    return stocks.filter((s) => s.archivedAt === null)
  }, [stocks, query])

  async function handleArchive(id: number) {
    setBusy(true)
    setError(null)
    try {
      await archivePaperStock({ data: id })
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
      await unarchivePaperStock({ data: id })
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed.')
    } finally {
      setBusy(false)
    }
  }

  const canCreate = manufacturers.length > 0

  return (
    <motion.div initial="hidden" animate="visible" variants={item}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="kicker mb-1.5">Lookup</p>
          <h2 className="font-serif text-ink text-2xl leading-tight italic">
            Paper stocks
          </h2>
          <p className="text-ink-soft mt-2 max-w-xl text-sm leading-relaxed">
            Darkroom papers. Each stock lives under one manufacturer and
            records its base, tone, and whether it's variable-contrast or
            graded.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCreating(true)
            setEditingId(null)
          }}
          disabled={creating || busy || !canCreate}
          className="shrink-0"
        >
          <Plus aria-hidden className="size-4" />
          Add paper
        </Button>
      </div>

      {!canCreate ? (
        <p className="text-ink-soft mb-4 text-sm">
          Add at least one manufacturer in the Manufacturers tab before
          creating a paper stock.
        </p>
      ) : null}

      {error ? (
        <p className="text-destructive mb-4 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <LookupSearch
        value={query}
        onChange={setQuery}
        placeholder="Find a paper…"
        total={stocks.length}
        filtered={filtered.length}
      />

      <ul>
        {creating ? (
          <li className="border-hairline bg-muted/20 border-b">
            <NewRow
              manufacturers={manufacturers}
              existingOrders={stocks.map((s) => s.sortOrder)}
              onCancel={() => setCreating(false)}
              onSaved={async () => {
                setCreating(false)
                await router.invalidate()
              }}
              onError={setError}
            />
          </li>
        ) : null}
        {stocks.length === 0 && !creating ? (
          <li className="border-hairline border-b py-12 text-center">
            <p className="kicker text-ink-muted mb-1">Empty list</p>
            <p className="text-ink-soft font-serif italic">
              No paper stocks defined yet.
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
        {filtered.map((s) =>
          editingId === s.id ? (
            <li
              key={s.id}
              className="border-hairline bg-muted/20 border-b"
            >
              <EditRow
                stock={s}
                manufacturers={manufacturers}
                onCancel={() => setEditingId(null)}
                onSaved={async () => {
                  setEditingId(null)
                  await router.invalidate()
                }}
                onError={setError}
              />
            </li>
          ) : (
            <li key={s.id} className="border-hairline border-b">
              <DisplayRow
                stock={s}
                busy={busy}
                onEdit={() => {
                  setEditingId(s.id)
                  setCreating(false)
                }}
                onArchive={() => handleArchive(s.id)}
                onUnarchive={() => handleUnarchive(s.id)}
              />
            </li>
          ),
        )}
      </ul>
    </motion.div>
  )
}

function contrastDisplay(stock: PaperStockWithManufacturer): string {
  if (stock.contrast === 'graded') {
    return stock.grade !== null ? `Graded ${stock.grade}` : 'Graded'
  }
  return 'Variable'
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
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        disabled={busy}
        aria-label={`Edit ${stock.label}`}
      >
        <Pencil aria-hidden className="size-3.5" />
      </Button>
      {archived ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onUnarchive}
          disabled={busy}
          aria-label={`Restore ${stock.label}`}
        >
          <RotateCcw aria-hidden className="size-3.5" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={onArchive}
          disabled={busy}
          aria-label={`Archive ${stock.label}`}
        >
          <Archive aria-hidden className="size-3.5" />
        </Button>
      )}
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
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="safelight"
            size="sm"
            onClick={onSave}
            disabled={
              saving || !state.label.trim() || state.manufacturerId === null
            }
          >
            <Check aria-hidden className="size-3.5" />
            <span>{submitLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

function FieldWrap({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="kicker">
        {label}
      </Label>
      {children}
    </div>
  )
}
