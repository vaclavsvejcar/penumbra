import { useRouter } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { NegativeIdInput } from '#/components/NegativeIdInput'
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
    ? String(negative.seqGlobal).padStart(4, '0')
    : String(nextSequences?.global ?? 1).padStart(4, '0')
  const initialYearStr = negative
    ? String(negative.year)
    : String(initialYear)
  const initialSeqYear = negative
    ? String(negative.seqYear).padStart(3, '0')
    : String(suggestSeqYear(nextSequences, initialYear)).padStart(3, '0')

  const [filmStockId, setFilmStockId] = useState<number | null>(
    negative?.filmStockId ?? filmStocks[0]?.id ?? null,
  )
  const [developerId, setDeveloperId] = useState<number | null>(
    negative?.developerId ?? null,
  )
  const [developedAt, setDevelopedAt] = useState(initialDate)
  const [devNotes, setDevNotes] = useState(negative?.devNotes ?? '')
  const [seqGlobalStr, setSeqGlobalStr] = useState(initialSeqGlobal)
  const [yearStr, setYearStr] = useState(initialYearStr)
  const [seqYearStr, setSeqYearStr] = useState(initialSeqYear)
  const [yearTouched, setYearTouched] = useState(false)
  const [seqYearTouched, setSeqYearTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const yearNum = Number(yearStr)
  const yearValid = Number.isInteger(yearNum) && yearNum >= 1900 && yearNum <= 2999

  // When developedAt changes, re-sync year (unless the user has touched it).
  useEffect(() => {
    if (isEdit || yearTouched) return
    const dateYear = parseYearFromIsoDate(developedAt)
    if (dateYear !== null) setYearStr(String(dateYear))
  }, [developedAt, isEdit, yearTouched])

  // When the identifier's year changes, re-suggest seqYear (unless touched).
  useEffect(() => {
    if (isEdit || seqYearTouched) return
    if (!yearValid) return
    setSeqYearStr(
      String(suggestSeqYear(nextSequences, yearNum)).padStart(3, '0'),
    )
  }, [yearNum, yearValid, isEdit, seqYearTouched, nextSequences])

  const seqGlobalNum = Number(seqGlobalStr)
  const seqYearNum = Number(seqYearStr)
  const seqGlobalValid =
    Number.isInteger(seqGlobalNum) && seqGlobalNum > 0 && seqGlobalNum <= 9999
  const seqYearValid =
    Number.isInteger(seqYearNum) && seqYearNum > 0 && seqYearNum <= 999

  const identifierValid = seqGlobalValid && yearValid && seqYearValid

  function reset() {
    setFilmStockId(negative?.filmStockId ?? filmStocks[0]?.id ?? null)
    setDeveloperId(negative?.developerId ?? null)
    setDevelopedAt(initialDate)
    setDevNotes(negative?.devNotes ?? '')
    setSeqGlobalStr(initialSeqGlobal)
    setYearStr(initialYearStr)
    setSeqYearStr(initialSeqYear)
    setYearTouched(false)
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
    if (!isEdit && !identifierValid) {
      setError(
        'Identifier must be a valid global number, four-digit year, and year sequence.',
      )
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
            year: yearNum,
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
              <Label id="neg-id-label" className="kicker">
                Identifier<span className="text-safelight ml-1">*</span>
              </Label>
              <NegativeIdInput
                aria-labelledby="neg-id-label"
                seqGlobal={seqGlobalStr}
                year={yearStr}
                seqYear={seqYearStr}
                onSeqGlobalChange={setSeqGlobalStr}
                onYearChange={(v) => {
                  setYearStr(v)
                  setYearTouched(true)
                }}
                onSeqYearChange={(v) => {
                  setSeqYearStr(v)
                  setSeqYearTouched(true)
                }}
                invalid={{
                  seqGlobal: !seqGlobalValid,
                  year: !yearValid,
                  seqYear: !seqYearValid,
                }}
              />
              <p className="text-ink-muted text-xs">
                Prefilled with the next free number. Year auto-syncs with
                Developed until you edit it.
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
                  (!isEdit && !identifierValid)
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
