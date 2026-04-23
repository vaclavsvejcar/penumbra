import { useRouter } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Textarea } from '#/components/ui/textarea'
import type {
  DeveloperWithManufacturer,
  FilmStockWithManufacturer,
  NegativeWithRefs,
} from '#/db/schema'
import { negativeDisplayId } from '#/lib/negative-id'
import { createNegative, updateNegative } from '#/server/negatives'

const NO_DEVELOPER = '__none__'

export type NegativeSequenceSuggestion = {
  global: number
  byYear: Record<number, number>
}

type NegativeSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  negative?: NegativeWithRefs
  filmStocks: FilmStockWithManufacturer[]
  developers: DeveloperWithManufacturer[]
  nextSequences?: NegativeSequenceSuggestion
}

function suggestSeqYear(
  next: NegativeSequenceSuggestion | undefined,
  year: number,
): number {
  if (!next) return 1
  return next.byYear[year] ?? 1
}

function parseYearFromIsoDate(iso: string): number | null {
  const m = iso.match(/^(\d{4})-\d{2}-\d{2}$/)
  return m ? Number(m[1]) : null
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0')
}

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toIsoDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function NegativeSheet({
  open,
  onOpenChange,
  negative,
  filmStocks,
  developers,
  nextSequences,
}: NegativeSheetProps) {
  const isEdit = !!negative
  const router = useRouter()

  const initialDate = useMemo(
    () => (negative ? toIsoDate(negative.developedAt) : todayIso()),
    [negative],
  )

  const initialYear = useMemo(() => {
    if (negative) return negative.year
    return parseYearFromIsoDate(initialDate) ?? new Date().getFullYear()
  }, [negative, initialDate])

  const initialSeqGlobal = negative
    ? String(negative.seqGlobal)
    : String(nextSequences?.global ?? 1)
  const initialSeqYear = negative
    ? String(negative.seqYear)
    : String(suggestSeqYear(nextSequences, initialYear))

  const [filmStockId, setFilmStockId] = useState<number | null>(
    negative?.filmStockId ?? filmStocks[0]?.id ?? null,
  )
  const [developerId, setDeveloperId] = useState<number | null>(
    negative?.developerId ?? null,
  )
  const [developedAt, setDevelopedAt] = useState(initialDate)
  const [devNotes, setDevNotes] = useState(negative?.devNotes ?? '')
  const [seqGlobalStr, setSeqGlobalStr] = useState(initialSeqGlobal)
  const [seqYearStr, setSeqYearStr] = useState(initialSeqYear)
  const [seqYearTouched, setSeqYearTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dateYear = parseYearFromIsoDate(developedAt) ?? initialYear

  // Re-suggest year sequence when the developed year changes, but only if the
  // user hasn't manually edited the field.
  useEffect(() => {
    if (isEdit || seqYearTouched) return
    setSeqYearStr(String(suggestSeqYear(nextSequences, dateYear)))
  }, [dateYear, isEdit, seqYearTouched, nextSequences])

  const seqGlobalNum = Number(seqGlobalStr)
  const seqYearNum = Number(seqYearStr)
  const seqGlobalValid =
    Number.isInteger(seqGlobalNum) && seqGlobalNum > 0 && seqGlobalNum <= 9999
  const seqYearValid =
    Number.isInteger(seqYearNum) && seqYearNum > 0 && seqYearNum <= 999

  const previewId =
    seqGlobalValid && seqYearValid
      ? `${pad(seqGlobalNum, 4)}/${dateYear}-${pad(seqYearNum, 3)}`
      : null

  function reset() {
    setFilmStockId(negative?.filmStockId ?? filmStocks[0]?.id ?? null)
    setDeveloperId(negative?.developerId ?? null)
    setDevelopedAt(initialDate)
    setDevNotes(negative?.devNotes ?? '')
    setSeqGlobalStr(initialSeqGlobal)
    setSeqYearStr(initialSeqYear)
    setSeqYearTouched(false)
    setError(null)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (filmStockId === null) {
      setError('Pick a film stock.')
      return
    }
    if (!developedAt) {
      setError('Developed date is required.')
      return
    }
    if (!isEdit && (!seqGlobalValid || !seqYearValid)) {
      setError('Global № and Year № must be positive integers.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const basePayload = {
        filmStockId,
        developerId,
        developedAt,
        devNotes,
      }
      if (isEdit) {
        await updateNegative({ data: { id: negative.id, ...basePayload } })
      } else {
        await createNegative({
          data: {
            ...basePayload,
            seqGlobal: seqGlobalNum,
            seqYear: seqYearNum,
          },
        })
      }
      await router.invalidate()
      onOpenChange(false)
      if (!isEdit) reset()
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
          <p className="kicker">{isEdit ? 'Edit roll' : 'New roll'}</p>
          <SheetTitle className="font-serif text-ink text-3xl font-normal italic">
            {isEdit ? 'Edit negative' : 'Add negative'}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? `Update the development record for ${negativeDisplayId(negative)}.`
              : 'Log a developed roll. IDs are prefilled with the next free number — override if you need to fill a gap.'}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-5 px-4 py-2"
        >
          <Field label="Film stock" htmlFor="neg-film" required>
            <Select
              value={filmStockId ? String(filmStockId) : undefined}
              onValueChange={(v) => setFilmStockId(Number(v))}
            >
              <SelectTrigger id="neg-film" className="w-full">
                <SelectValue placeholder="Select a film stock" />
              </SelectTrigger>
              <SelectContent>
                {filmStocks.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.manufacturer.label} {s.label} · ISO {s.iso}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Developer" htmlFor="neg-dev">
            <Select
              value={developerId ? String(developerId) : NO_DEVELOPER}
              onValueChange={(v) =>
                setDeveloperId(v === NO_DEVELOPER ? null : Number(v))
              }
            >
              <SelectTrigger id="neg-dev" className="w-full">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_DEVELOPER}>None</SelectItem>
                {developers.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.manufacturer.label} {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Developed" htmlFor="neg-date" required>
            <Input
              id="neg-date"
              type="date"
              value={developedAt}
              onChange={(e) => setDevelopedAt(e.target.value)}
              className="font-mono tabular-nums"
              required
            />
          </Field>

          {!isEdit ? (
            <div className="flex flex-col gap-2">
              <Label className="kicker">
                Identifier<span className="text-safelight ml-1">*</span>
              </Label>
              <div className="grid grid-cols-[1fr_auto_1fr_auto_auto] items-center gap-2">
                <Input
                  id="neg-seq-global"
                  type="number"
                  min={1}
                  max={9999}
                  value={seqGlobalStr}
                  onChange={(e) => setSeqGlobalStr(e.target.value)}
                  className="font-mono tabular-nums"
                  aria-label="Global number"
                  aria-invalid={seqGlobalValid ? undefined : true}
                  required
                />
                <span className="text-ink-muted font-mono text-sm">/</span>
                <Input
                  readOnly
                  tabIndex={-1}
                  value={dateYear}
                  className="text-ink-soft bg-muted/40 font-mono tabular-nums"
                  aria-label="Year (from developed date)"
                />
                <span className="text-ink-muted font-mono text-sm">-</span>
                <Input
                  id="neg-seq-year"
                  type="number"
                  min={1}
                  max={999}
                  value={seqYearStr}
                  onChange={(e) => {
                    setSeqYearStr(e.target.value)
                    setSeqYearTouched(true)
                  }}
                  className="font-mono tabular-nums"
                  aria-label="Year sequence"
                  aria-invalid={seqYearValid ? undefined : true}
                  required
                />
              </div>
              <p className="text-ink-muted text-xs">
                Preview:{' '}
                <span className="text-ink-soft font-mono tabular-nums">
                  {previewId ?? '—'}
                </span>
              </p>
            </div>
          ) : null}

          <Field label="Dev notes" htmlFor="neg-notes">
            <Textarea
              id="neg-notes"
              value={devNotes}
              onChange={(e) => setDevNotes(e.target.value)}
              rows={4}
              placeholder="Dilution, time, agitation, anything worth remembering."
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
                variant="safelight"
                disabled={
                  submitting ||
                  filmStockId === null ||
                  (!isEdit && (!seqGlobalValid || !seqYearValid))
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
