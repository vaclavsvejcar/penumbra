import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  NegativeSheet,
  type NegativeSequenceSuggestion,
} from '#/components/NegativeSheet'
import type { NegativeWithRefs } from '#/db/schema'
import { negativeDisplayId } from '#/lib/negative-id'
import { listDeveloperDilutions } from '#/server/developerDilutions'
import { listDevelopers } from '#/server/developers'
import { listFilmStocks } from '#/server/filmStocks'
import { listAllNegatives } from '#/server/negatives'

export const Route = createFileRoute('/negatives/')({
  component: NegativesIndex,
  loader: async () => ({
    negatives: await listAllNegatives(),
    filmStocks: await listFilmStocks(),
    developers: await listDevelopers(),
    dilutions: await listDeveloperDilutions(),
  }),
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

function computeNextSequences(
  rows: NegativeWithRefs[],
): NegativeSequenceSuggestion {
  let global = 0
  const maxByYear: Record<number, number> = {}
  for (const n of rows) {
    if (n.seqGlobal > global) global = n.seqGlobal
    const cur = maxByYear[n.year] ?? 0
    if (n.seqYear > cur) maxByYear[n.year] = n.seqYear
  }
  const byYear: Record<number, number> = {}
  for (const [y, v] of Object.entries(maxByYear)) {
    byYear[Number(y)] = v + 1
  }
  return { global: global + 1, byYear }
}

function NegativesIndex() {
  const { negatives, filmStocks, developers, dilutions } = Route.useLoaderData()
  const [open, setOpen] = useState(false)

  const nextSequences = useMemo(
    () => computeNextSequences(negatives),
    [negatives],
  )

  const canCreate = filmStocks.length > 0

  return (
    <motion.section
      className="py-16 sm:py-24"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <motion.div
        variants={item}
        className="flex items-end justify-between gap-6"
      >
        <div>
          <p className="kicker mb-4">Archive</p>
          <h1 className="font-serif text-ink mb-4 text-5xl leading-[0.95] font-normal tracking-tight italic sm:text-6xl">
            Negatives
          </h1>
          <p className="text-ink-soft max-w-xl text-base leading-relaxed sm:text-lg">
            The roll log. One row per developed negative.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="shrink-0"
          disabled={!canCreate}
        >
          <Plus aria-hidden className="size-4" />
          Add roll
        </Button>
      </motion.div>

      {!canCreate ? (
        <motion.p variants={item} className="text-ink-soft mt-10 text-sm">
          Add at least one film stock in Lookups before logging a roll.
        </motion.p>
      ) : null}

      <motion.div variants={item} className="mt-14">
        {negatives.length === 0 ? (
          <EmptyState />
        ) : (
          <NegativeList rows={negatives} />
        )}
      </motion.div>

      <NegativeSheet
        open={open}
        onOpenChange={setOpen}
        filmStocks={filmStocks}
        developers={developers}
        dilutions={dilutions}
        nextSequences={nextSequences}
      />
    </motion.section>
  )
}

function EmptyState() {
  return (
    <div className="border-hairline flex h-72 flex-col items-center justify-center gap-3 rounded-md border border-dashed">
      <p className="kicker text-ink-muted">No rolls yet</p>
      <p className="text-ink-soft font-serif text-xl italic">
        The archive is empty.
      </p>
    </div>
  )
}

function NegativeList({ rows }: { rows: NegativeWithRefs[] }) {
  return (
    <ul className="border-hairline border-t">
      {rows.map((n) => {
        const archived = n.archivedAt !== null
        return (
          <li key={n.id} className="border-hairline border-b">
            <Link
              to="/negatives/$id"
              params={{ id: String(n.id) }}
              className={
                'hover:bg-muted/40 grid grid-cols-[10rem_1fr_auto_auto_auto] items-center gap-4 py-4 no-underline transition-colors sm:gap-6 ' +
                (archived ? 'opacity-55' : '')
              }
            >
              <span className="text-ink font-mono text-sm tabular-nums">
                {negativeDisplayId(n)}
              </span>
              <div className="min-w-0">
                <p className="text-ink truncate text-sm font-medium">
                  {n.filmStock.manufacturer.label} {n.filmStock.label}
                </p>
                <p className="text-ink-muted truncate text-xs">
                  ISO {n.filmStock.iso}
                  {n.developer ? (
                    <>
                      <span className="mx-1.5">·</span>
                      <span>
                        {n.developer.manufacturer.label} {n.developer.label}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-ink-soft hidden font-normal tabular-nums sm:inline-flex"
              >
                {n.frameCount} frame{n.frameCount === 1 ? '' : 's'}
                {n.keeperCount > 0 ? ` · ${n.keeperCount} keeper${n.keeperCount === 1 ? '' : 's'}` : ''}
              </Badge>
              <span className="text-ink-soft hidden text-sm sm:inline">
                {dateFmt.format(n.developedAt)}
              </span>
              {archived ? (
                <Badge
                  variant="outline"
                  className="text-ink-muted font-normal normal-case tracking-normal"
                >
                  archived
                </Badge>
              ) : (
                <span className="text-ink-muted font-mono text-xs tabular-nums">
                  {String(n.seqGlobal).padStart(4, '0')}
                </span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
