import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Textarea } from '#/components/ui/textarea'
import type { Frame } from '#/db/schema'
import { createFrame, updateFrame } from '#/server/frames'

const MIN_FRAME = 1
const MAX_FRAME = 36

type FrameSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  negativeId: number
  frame?: Frame
  takenNumbers: number[]
}

function toIsoDate(d: Date | null): string {
  if (!d) return ''
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function suggestNextFrameNumber(taken: number[]): number {
  const set = new Set(taken)
  for (let n = MIN_FRAME; n <= MAX_FRAME; n++) {
    if (!set.has(n)) return n
  }
  return MIN_FRAME
}

export function FrameSheet({
  open,
  onOpenChange,
  negativeId,
  frame,
  takenNumbers,
}: FrameSheetProps) {
  const isEdit = !!frame
  const router = useRouter()

  const initialNumber = frame
    ? String(frame.frameNumber)
    : String(suggestNextFrameNumber(takenNumbers))

  const [frameNumber, setFrameNumber] = useState(initialNumber)
  const [subject, setSubject] = useState(frame?.subject ?? '')
  const [dateShot, setDateShot] = useState(toIsoDate(frame?.dateShot ?? null))
  const [keeper, setKeeper] = useState(frame?.keeper ?? false)
  const [notes, setNotes] = useState(frame?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setFrameNumber(initialNumber)
    setSubject(frame?.subject ?? '')
    setDateShot(toIsoDate(frame?.dateShot ?? null))
    setKeeper(frame?.keeper ?? false)
    setNotes(frame?.notes ?? '')
    setError(null)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = Number(frameNumber)
    if (!Number.isInteger(n) || n < MIN_FRAME || n > MAX_FRAME) {
      setError(`Frame number must be between ${MIN_FRAME} and ${MAX_FRAME}.`)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        frameNumber: n,
        subject,
        dateShot,
        keeper,
        notes,
      }
      if (isEdit) {
        await updateFrame({ data: { id: frame.id, ...payload } })
      } else {
        await createFrame({ data: { negativeId, ...payload } })
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
          <p className="kicker">{isEdit ? 'Edit frame' : 'New frame'}</p>
          <SheetTitle className="font-serif text-ink text-3xl font-normal italic">
            {isEdit ? 'Edit frame' : 'Add frame'}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update what was on this frame.'
              : 'Note an exposure on this roll. Add only the frames worth remembering.'}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-5 px-4 py-2"
        >
          <Field label="Frame №" htmlFor="frame-number" required>
            <Input
              id="frame-number"
              type="number"
              min={MIN_FRAME}
              max={MAX_FRAME}
              value={frameNumber}
              onChange={(e) => setFrameNumber(e.target.value)}
              className="font-mono tabular-nums"
              autoFocus={!isEdit}
              required
            />
          </Field>

          <Field label="Subject" htmlFor="frame-subject">
            <Input
              id="frame-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What's on it?"
            />
          </Field>

          <Field label="Date shot" htmlFor="frame-date">
            <Input
              id="frame-date"
              type="date"
              value={dateShot}
              onChange={(e) => setDateShot(e.target.value)}
              className="font-mono tabular-nums"
            />
          </Field>

          <div className="flex items-center gap-3">
            <input
              id="frame-keeper"
              type="checkbox"
              checked={keeper}
              onChange={(e) => setKeeper(e.target.checked)}
              className="border-hairline accent-safelight size-4 rounded border"
            />
            <Label htmlFor="frame-keeper" className="text-ink text-sm">
              Keeper — worth printing
            </Label>
          </div>

          <Field label="Notes" htmlFor="frame-notes">
            <Textarea
              id="frame-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Light, mood, exposure, anything to remember."
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
              <Button type="submit" variant="safelight" disabled={submitting}>
                {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add frame'}
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
