import {
  createFileRoute,
  Link,
  notFound,
  useRouter,
} from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ConfirmDialog'
import { FrameSheet } from '#/components/FrameSheet'
import { NegativeSheet } from '#/components/NegativeSheet'
import type { Frame, NegativeWithRefs } from '#/db/schema'
import { negativeDisplayId, paddedFrameNumber } from '#/lib/negative-id'
import { cn } from '#/lib/utils'
import { listDevelopers } from '#/server/developers'
import { listFilmStocks } from '#/server/filmStocks'
import { deleteFrame, listFrames } from '#/server/frames'
import {
  archiveNegative,
  getNegative,
  unarchiveNegative,
} from '#/server/negatives'

type NegativeSearch = { focus?: number }

function parseFocus(search: Record<string, unknown>): NegativeSearch {
  const raw = search.focus
  const n =
    typeof raw === 'string' ? Number(raw) : typeof raw === 'number' ? raw : NaN
  return Number.isInteger(n) && n > 0 ? { focus: n } : {}
}

export const Route = createFileRoute('/negatives/$id')({
  component: NegativeDetail,
  validateSearch: parseFocus,
  loader: async ({ params }) => {
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) throw notFound()
    const [negative, frames, filmStocks, developers] = await Promise.all([
      getNegative({ data: id }),
      listFrames({ data: id }),
      listFilmStocks(),
      listDevelopers(),
    ])
    if (!negative) throw notFound()
    return { negative, frames, filmStocks, developers }
  },
  notFoundComponent: NegativeNotFound,
})

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const TYPE_LABELS: Record<string, string> = {
  bw: 'Black & white',
  color_neg: 'Color negative',
  slide: 'Slide',
}

function NegativeDetail() {
  const { negative, frames, filmStocks, developers } = Route.useLoaderData()
  const router = useRouter()
  const archived = negative.archivedAt !== null

  const [editOpen, setEditOpen] = useState(false)
  const [frameSheetOpen, setFrameSheetOpen] = useState(false)
  const [editingFrame, setEditingFrame] = useState<Frame | null>(null)
  const [frameToDelete, setFrameToDelete] = useState<Frame | null>(null)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const takenNumbers = useMemo(() => frames.map((f) => f.frameNumber), [frames])

  function startNewFrame() {
    setEditingFrame(null)
    setFrameSheetOpen(true)
  }

  function startEditFrame(frame: Frame) {
    setEditingFrame(frame)
    setFrameSheetOpen(true)
  }

  async function confirmDeleteFrame() {
    if (!frameToDelete) return
    await deleteFrame({ data: frameToDelete.id })
    await router.invalidate()
  }

  async function confirmArchive() {
    await archiveNegative({ data: negative.id })
    await router.invalidate()
  }

  async function onUnarchive() {
    setBusy(true)
    setError(null)
    try {
      await unarchiveNegative({ data: negative.id })
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unarchive roll.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.section
      className="py-16 sm:py-24"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <motion.div variants={item}>
        <Link
          to="/negatives"
          className="text-ink-soft hover:text-ink inline-flex items-center gap-1.5 text-xs no-underline"
        >
          <ArrowLeft aria-hidden className="size-3.5" />
          <span className="kicker">Negatives</span>
        </Link>
      </motion.div>

      <motion.div
        variants={item}
        className="mt-8 flex items-end justify-between gap-6"
      >
        <div className="min-w-0">
          <p className="kicker mb-4 flex items-center gap-2">
            <span className="font-mono tabular-nums">
              {negativeDisplayId(negative)}
            </span>
            <span>·</span>
            <span>{dateFmt.format(negative.developedAt)}</span>
            {archived ? (
              <>
                <span>·</span>
                <Badge
                  variant="outline"
                  className="text-ink-muted font-normal normal-case tracking-normal"
                >
                  archived
                </Badge>
              </>
            ) : null}
          </p>
          <h1 className="font-serif text-5xl leading-[0.95] font-normal tracking-tight italic break-words sm:text-6xl">
            <span className="text-ink">
              {negative.filmStock.manufacturer.label}
            </span>{' '}
            <span className="text-ink-soft">{negative.filmStock.label}</span>
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
          className="shrink-0"
          disabled={busy}
        >
          <Pencil aria-hidden className="size-4" />
          Edit
        </Button>
      </motion.div>

      {error ? (
        <motion.p
          variants={item}
          className="text-destructive mt-6 text-sm"
          role="alert"
        >
          {error}
        </motion.p>
      ) : null}

      <motion.div variants={item} className="pt-10">
        <Section title="Roll">
          <dl className="grid grid-cols-[7rem_1fr] gap-x-6 gap-y-3 text-sm">
            <Def term="Film stock">
              {negative.filmStock.manufacturer.label} {negative.filmStock.label}
            </Def>
            <Def term="Type">
              {TYPE_LABELS[negative.filmStock.type] ?? negative.filmStock.type}
            </Def>
            <Def term="ISO" mono>
              {String(negative.filmStock.iso)}
            </Def>
            <Def term="Developer">
              {negative.developer
                ? `${negative.developer.manufacturer.label} ${negative.developer.label}`
                : null}
            </Def>
            <Def term="Developed" mono>
              {dateFmt.format(negative.developedAt)}
            </Def>
          </dl>
        </Section>

        {negative.devNotes ? (
          <Section title="Dev notes">
            <p className="text-ink max-w-2xl text-sm leading-relaxed whitespace-pre-wrap">
              {negative.devNotes}
            </p>
          </Section>
        ) : null}

        <FramesSection
          frames={frames}
          busy={busy}
          archived={archived}
          onAdd={startNewFrame}
          onEdit={startEditFrame}
          onDelete={(f) => setFrameToDelete(f)}
        />

        <Section title="Lifecycle">
          <div className="flex flex-wrap items-center gap-3">
            {archived ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onUnarchive}
                disabled={busy}
              >
                Unarchive roll
              </Button>
            ) : (
              <Button
                variant="destructive-outline"
                size="sm"
                onClick={() => setArchiveOpen(true)}
                disabled={busy}
              >
                Archive roll
              </Button>
            )}
          </div>
        </Section>
      </motion.div>

      <motion.p
        variants={item}
        className="text-ink-muted mt-16 font-mono text-[0.65rem] tracking-wide tabular-nums"
      >
        Created {dateTimeFmt.format(negative.createdAt)} · Updated{' '}
        {dateTimeFmt.format(negative.updatedAt)}
      </motion.p>

      <NegativeSheet
        key={`neg-edit-${negative.id}`}
        open={editOpen}
        onOpenChange={setEditOpen}
        negative={negative}
        filmStocks={filmStocks}
        developers={developers}
      />

      <FrameSheet
        key={editingFrame ? `frame-edit-${editingFrame.id}` : 'frame-new'}
        open={frameSheetOpen}
        onOpenChange={setFrameSheetOpen}
        negativeId={negative.id}
        frame={editingFrame ?? undefined}
        takenNumbers={takenNumbers}
      />

      <ConfirmDialog
        open={frameToDelete !== null}
        onOpenChange={(next) => {
          if (!next) setFrameToDelete(null)
        }}
        kicker="Delete"
        title={
          frameToDelete
            ? `Delete frame ${paddedFrameNumber(frameToDelete)}?`
            : ''
        }
        description="This frame record will be removed permanently. The negative itself stays in the archive."
        confirmLabel="Delete frame"
        tone="destructive"
        onConfirm={confirmDeleteFrame}
      />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        kicker="Archive"
        title={`Archive roll ${negativeDisplayId(negative)}?`}
        description="It stays in the archive but is hidden from active lists. You can unarchive any time."
        confirmLabel="Archive roll"
        tone="destructive"
        onConfirm={confirmArchive}
      />
    </motion.section>
  )
}

function FramesSection({
  frames,
  busy,
  archived,
  onAdd,
  onEdit,
  onDelete,
}: {
  frames: Frame[]
  busy: boolean
  archived: boolean
  onAdd: () => void
  onEdit: (frame: Frame) => void
  onDelete: (frame: Frame) => void
}) {
  const { focus } = Route.useSearch()
  const focusedRef = useRef<HTMLLIElement | null>(null)

  useEffect(() => {
    if (focus && focusedRef.current) {
      focusedRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [focus])

  return (
    <motion.section
      variants={item}
      className="border-hairline border-t py-8 first:border-t-0 first:pt-0"
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="kicker">Frames</p>
          <p className="text-ink-muted mt-1 text-xs">
            Add only the exposures worth remembering.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onAdd}
          disabled={busy || archived}
        >
          <Plus aria-hidden className="size-4" />
          Add frame
        </Button>
      </div>

      {frames.length === 0 ? (
        <div className="border-hairline flex h-32 items-center justify-center rounded-md border border-dashed">
          <p className="text-ink-muted font-serif text-base italic">
            No frames logged on this roll.
          </p>
        </div>
      ) : (
        <ul className="border-hairline border-t">
          {frames.map((f) => {
            const isFocused = focus === f.id
            return (
              <li
                key={f.id}
                ref={isFocused ? focusedRef : undefined}
                className={cn(
                  'border-hairline border-b transition-colors',
                  isFocused && 'bg-safelight/10',
                )}
              >
                <div className="grid grid-cols-[3rem_1fr_auto_auto] items-center gap-4 py-3 sm:gap-6">
                  <span className="text-ink font-mono text-sm tabular-nums">
                    {paddedFrameNumber(f)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-ink truncate text-sm">
                      {f.subject ?? (
                        <span className="text-ink-muted italic">
                          (no subject)
                        </span>
                      )}
                    </p>
                    {f.dateShot || f.notes ? (
                      <p className="text-ink-muted truncate text-xs">
                        {f.dateShot ? dateFmt.format(f.dateShot) : null}
                        {f.dateShot && f.notes ? (
                          <span className="mx-1.5">·</span>
                        ) : null}
                        {f.notes}
                      </p>
                    ) : null}
                  </div>
                  {f.keeper ? (
                    <Badge
                      variant="outline"
                      className="text-safelight border-safelight/40 font-normal normal-case tracking-normal"
                    >
                      keeper
                    </Badge>
                  ) : (
                    <span className="hidden sm:inline" />
                  )}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(f)}
                      disabled={busy || archived}
                      aria-label={`Edit frame ${paddedFrameNumber(f)}`}
                    >
                      <Pencil aria-hidden className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(f)}
                      disabled={busy || archived}
                      aria-label={`Delete frame ${paddedFrameNumber(f)}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </motion.section>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <motion.section
      variants={item}
      className="border-hairline border-t py-8 first:border-t-0 first:pt-0"
    >
      <p className="kicker mb-5">{title}</p>
      {children}
    </motion.section>
  )
}

function Def({
  term,
  children,
  mono,
}: {
  term: string
  children: React.ReactNode
  mono?: boolean
}) {
  const isEmpty = children === null || children === undefined || children === ''
  return (
    <>
      <dt className="kicker pt-0.5">{term}</dt>
      <dd
        className={
          isEmpty
            ? 'text-ink-muted'
            : mono
              ? 'text-ink font-mono tabular-nums'
              : 'text-ink'
        }
      >
        {isEmpty ? '—' : children}
      </dd>
    </>
  )
}

function NegativeNotFound() {
  const router = useRouter()
  return (
    <section className="py-24">
      <p className="kicker mb-4">404</p>
      <h1 className="font-serif text-ink mb-4 text-5xl leading-[0.95] italic">
        Negative not found.
      </h1>
      <p className="text-ink-soft mb-8 max-w-xl text-base leading-relaxed">
        This roll has been removed or never existed.
      </p>
      <Button variant="outline" size="sm" onClick={() => router.history.back()}>
        <ArrowLeft aria-hidden className="size-4" />
        Go back
      </Button>
    </section>
  )
}
