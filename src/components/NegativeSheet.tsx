import { useRouter } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { NegativeIdInput } from '#/components/NegativeIdInput'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  SearchSelect,
  type SearchSelectItem,
} from '#/components/ui/search-select'
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
  DeveloperDilutionWithDeveloper,
  DeveloperWithManufacturer,
  FilmStockWithManufacturer,
  NegativeWithRefs,
} from '#/db/schema'
import { negativeDisplayId } from '#/lib/negative-id'
import { createNegative, updateNegative } from '#/server/negatives'

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
  dilutions: DeveloperDilutionWithDeveloper[]
  nextSequences?: NegativeSequenceSuggestion
}

function parseTimeToMinutes(raw: string): number | null | 'invalid' {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const colonMatch = trimmed.match(/^(\d{1,3}):(\d{1,2})$/)
  if (colonMatch) {
    const mm = Number(colonMatch[1])
    const ss = Number(colonMatch[2])
    if (!Number.isFinite(mm) || !Number.isFinite(ss) || ss >= 60) {
      return 'invalid'
    }
    return mm + ss / 60
  }
  const num = /^\d+(?:[.,]\d+)?$/.test(trimmed)
    ? Number(trimmed.replace(',', '.'))
    : NaN
  if (Number.isFinite(num) && num >= 0) return num
  return 'invalid'
}

function formatMinutesAsTime(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return ''
  if (!Number.isFinite(minutes) || minutes < 0) return ''
  const totalSeconds = Math.round(minutes * 60)
  const mm = Math.floor(totalSeconds / 60)
  const ss = totalSeconds % 60
  return `${mm}:${String(ss).padStart(2, '0')}`
}

function parseTempC(raw: string): number | null | 'invalid' {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const num = /^-?\d+(?:[.,]\d+)?$/.test(trimmed)
    ? Number(trimmed.replace(',', '.'))
    : NaN
  if (Number.isFinite(num)) return num
  return 'invalid'
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
  dilutions,
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
  const [dilutionId, setDilutionId] = useState<number | null>(
    negative?.developerDilutionId ?? null,
  )
  const [timeStr, setTimeStr] = useState(
    formatMinutesAsTime(negative?.devTimeMinutes ?? null),
  )
  const [tempStr, setTempStr] = useState(
    negative?.devTempC !== null && negative?.devTempC !== undefined
      ? String(negative.devTempC)
      : '',
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

  const filmStockItems = useMemo<SearchSelectItem[]>(
    () =>
      filmStocks.map((s) => ({
        key: String(s.id),
        label: `${s.manufacturer.label} ${s.label}`,
        subtitle: `ISO ${s.iso}`,
        searchText: `${s.manufacturer.label} ${s.label} ${s.code} iso${s.iso} ${s.type} ${s.process}`.toLowerCase(),
      })),
    [filmStocks],
  )

  const developerItems = useMemo<SearchSelectItem[]>(
    () =>
      developers.map((d) => ({
        key: String(d.id),
        label: `${d.manufacturer.label} ${d.label}`,
        searchText: `${d.manufacturer.label} ${d.label} ${d.code} ${d.appliesTo} ${d.form}`.toLowerCase(),
      })),
    [developers],
  )

  const dilutionItems = useMemo<SearchSelectItem[]>(() => {
    if (developerId === null) return []
    return dilutions
      .filter((d) => d.developerId === developerId)
      .map((d) => ({
        key: String(d.id),
        label: d.label,
        searchText: `${d.label} ${d.code}`.toLowerCase(),
      }))
  }, [dilutions, developerId])

  // Reset dilution if it doesn't belong to the currently selected developer.
  useEffect(() => {
    if (dilutionId === null) return
    const stillValid = dilutions.some(
      (d) => d.id === dilutionId && d.developerId === developerId,
    )
    if (!stillValid) setDilutionId(null)
  }, [developerId, dilutionId, dilutions])

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
    setDilutionId(negative?.developerDilutionId ?? null)
    setTimeStr(formatMinutesAsTime(negative?.devTimeMinutes ?? null))
    setTempStr(
      negative?.devTempC !== null && negative?.devTempC !== undefined
        ? String(negative.devTempC)
        : '',
    )
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
    const parsedTime = parseTimeToMinutes(timeStr)
    if (parsedTime === 'invalid') {
      setError('Development time must be mm:ss or minutes (e.g. 14:30 or 14).')
      return
    }
    const parsedTemp = parseTempC(tempStr)
    if (parsedTemp === 'invalid') {
      setError('Temperature must be a number in °C.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const basePayload = {
        filmStockId,
        developerId,
        developerDilutionId: dilutionId,
        devTimeMinutes: parsedTime,
        devTempC: parsedTemp,
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
            <SearchSelect
              id="neg-film"
              items={filmStockItems}
              value={filmStockId !== null ? String(filmStockId) : null}
              onChange={(k) => setFilmStockId(k === null ? null : Number(k))}
              placeholder="Select a film stock"
              searchPlaceholder="Search film stocks…"
              emptyLabel="No film stock matches."
            />
          </Field>

          <Field label="Developer" htmlFor="neg-dev">
            <SearchSelect
              id="neg-dev"
              items={developerItems}
              value={developerId !== null ? String(developerId) : null}
              onChange={(k) => setDeveloperId(k === null ? null : Number(k))}
              placeholder="None"
              clearLabel="None"
              searchPlaceholder="Search developers…"
              emptyLabel="No developer matches."
            />
          </Field>

          <Field label="Dilution" htmlFor="neg-dilution">
            <SearchSelect
              id="neg-dilution"
              items={dilutionItems}
              value={dilutionId !== null ? String(dilutionId) : null}
              onChange={(k) => setDilutionId(k === null ? null : Number(k))}
              placeholder={
                developerId === null
                  ? 'Pick a developer first'
                  : dilutionItems.length === 0
                    ? 'No dilutions defined for this developer'
                    : 'None'
              }
              clearLabel="None"
              searchPlaceholder="Search dilutions…"
              emptyLabel="No dilution matches."
              disabled={developerId === null || dilutionItems.length === 0}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Time" htmlFor="neg-time">
              <Input
                id="neg-time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                onBlur={(e) => {
                  const parsed = parseTimeToMinutes(e.target.value)
                  if (parsed === null) setTimeStr('')
                  else if (parsed !== 'invalid') {
                    setTimeStr(formatMinutesAsTime(parsed))
                  }
                }}
                placeholder="mm:ss"
                inputMode="numeric"
                autoComplete="off"
                className="font-mono tabular-nums"
              />
            </Field>
            <Field label="Temp °C" htmlFor="neg-temp">
              <Input
                id="neg-temp"
                value={tempStr}
                onChange={(e) => setTempStr(e.target.value)}
                placeholder="20"
                inputMode="decimal"
                autoComplete="off"
                className="font-mono tabular-nums"
              />
            </Field>
          </div>

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
              placeholder="Agitation, deviation from the recipe, anything worth remembering."
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
