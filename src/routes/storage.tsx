import { createFileRoute, useRouter } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  checkpointWal,
  getStorageInfo,
  vacuumDatabase,
  type CheckpointResult,
  type StorageFile,
  type VacuumResult,
} from '#/server/storage'

export const Route = createFileRoute('/storage')({
  component: StoragePage,
  loader: () => getStorageInfo(),
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

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let n = bytes / 1024
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i += 1
  }
  return `${n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.round(n)} ${units[i]}`
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function totalBytes(files: StorageFile[]): number {
  return files.reduce((sum, f) => sum + (f.bytes ?? 0), 0)
}

function splitCommonParent(files: StorageFile[]): {
  parent: string | null
  names: Map<string, string>
} {
  const names = new Map<string, string>()
  if (files.length === 0) return { parent: null, names }
  const parts = files.map((f) => {
    const idx = f.path.lastIndexOf('/')
    return idx === -1
      ? { dir: '', file: f.path }
      : { dir: f.path.slice(0, idx), file: f.path.slice(idx + 1) }
  })
  const firstDir = parts[0].dir
  const allSameDir = parts.every((p) => p.dir === firstDir)
  files.forEach((f, i) => names.set(f.path, parts[i].file))
  return { parent: allSameDir ? firstDir : null, names }
}

function StoragePage() {
  const info = Route.useLoaderData()
  const { database, files, tables } = info
  const total = totalBytes(files)
  const usedBytes = database.pageCount * database.pageSize
  const freeBytes = database.freelistCount * database.pageSize
  const { parent, names } = splitCommonParent(files)

  return (
    <motion.section
      className="py-16 sm:py-24"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <motion.p variants={item} className="kicker mb-4">
        Settings
      </motion.p>
      <motion.h1
        variants={item}
        className="font-serif text-ink mb-4 text-5xl leading-[0.95] font-normal tracking-tight italic sm:text-6xl"
      >
        Storage
      </motion.h1>
      <motion.p
        variants={item}
        className="text-ink-soft max-w-xl text-base leading-relaxed sm:text-lg"
      >
        Where Penumbra keeps its ledger, and how much room it takes up.
      </motion.p>

      <motion.div variants={item} className="mt-14">
        <p className="kicker mb-4">Database</p>
        <dl className="border-hairline grid grid-cols-1 gap-y-3 border-t pt-4 sm:grid-cols-[12rem_1fr]">
          <dt className="text-ink-soft text-sm">Path</dt>
          <dd className="text-ink break-all font-mono text-xs">
            {database.path}
          </dd>

          <dt className="text-ink-soft text-sm">Journal mode</dt>
          <dd className="text-ink font-mono text-xs uppercase">
            {database.journalMode}
          </dd>

          <dt className="text-ink-soft text-sm">Page size</dt>
          <dd className="text-ink font-mono text-xs tabular-nums">
            {formatNumber(database.pageSize)} B
          </dd>

          <dt className="text-ink-soft text-sm">Pages</dt>
          <dd className="text-ink font-mono text-xs tabular-nums">
            {formatNumber(database.pageCount)}{' '}
            <span className="text-ink-muted">
              ({formatBytes(usedBytes)} allocated)
            </span>
          </dd>

          <dt className="text-ink-soft text-sm">Free pages</dt>
          <dd className="text-ink font-mono text-xs tabular-nums">
            {formatNumber(database.freelistCount)}{' '}
            <span className="text-ink-muted">
              ({formatBytes(freeBytes)} reclaimable)
            </span>
          </dd>
        </dl>
      </motion.div>

      <motion.div variants={item} className="mt-14">
        <p className="kicker mb-4">Files</p>
        {parent ? (
          <p className="text-ink-muted mb-3 truncate font-mono text-xs">
            {parent}/
          </p>
        ) : null}
        <ul className="border-hairline border-t">
          {files.map((f) => (
            <li
              key={f.path}
              className="border-hairline grid grid-cols-[6rem_1fr_auto] items-center gap-6 border-b py-3.5"
            >
              <span className="text-ink text-sm font-medium">{f.label}</span>
              <span className="text-ink-muted truncate font-mono text-xs">
                {parent ? names.get(f.path) : f.path}
              </span>
              <span className="text-ink text-right font-mono text-xs tabular-nums">
                {formatBytes(f.bytes)}
              </span>
            </li>
          ))}
          <li className="grid grid-cols-[6rem_1fr_auto] items-center gap-6 py-4">
            <span className="kicker">Total</span>
            <span />
            <span className="text-ink text-right font-mono text-sm font-medium tabular-nums">
              {formatBytes(total)}
            </span>
          </li>
        </ul>
      </motion.div>

      <motion.div variants={item} className="mt-14">
        <p className="kicker mb-4">Tables</p>
        {tables.length === 0 ? (
          <p className="text-ink-muted text-sm">No tables yet.</p>
        ) : (
          <ul className="border-hairline border-t">
            {tables.map((t) => (
              <li
                key={t.name}
                className="border-hairline grid grid-cols-[1fr_auto] items-center gap-6 border-b py-3.5"
              >
                <span className="text-ink font-mono text-xs">{t.name}</span>
                <span className="text-ink text-right font-mono text-xs tabular-nums">
                  {formatNumber(t.rowCount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      <motion.div variants={item} className="mt-14">
        <p className="kicker mb-4">Maintenance</p>
        <Maintenance />
      </motion.div>
    </motion.section>
  )
}

type ActionState =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'ok'; message: string }
  | { kind: 'err'; message: string }

function Maintenance() {
  const router = useRouter()
  const [vacuum, setVacuum] = useState<ActionState>({ kind: 'idle' })
  const [checkpoint, setCheckpoint] = useState<ActionState>({ kind: 'idle' })

  async function runVacuum() {
    setVacuum({ kind: 'running' })
    try {
      const res: VacuumResult = await vacuumDatabase()
      await router.invalidate()
      setVacuum({
        kind: 'ok',
        message:
          res.reclaimedBytes > 0
            ? `Reclaimed ${formatBytes(res.reclaimedBytes)}.`
            : 'Already compact.',
      })
    } catch (e) {
      setVacuum({
        kind: 'err',
        message: e instanceof Error ? e.message : 'VACUUM failed.',
      })
    }
  }

  async function runCheckpoint() {
    setCheckpoint({ kind: 'running' })
    try {
      const res: CheckpointResult = await checkpointWal()
      await router.invalidate()
      setCheckpoint({
        kind: 'ok',
        message:
          res.busy > 0
            ? 'Checkpoint partial — DB was busy.'
            : `Flushed ${formatNumber(res.checkpointedPages)} page${
                res.checkpointedPages === 1 ? '' : 's'
              }.`,
      })
    } catch (e) {
      setCheckpoint({
        kind: 'err',
        message: e instanceof Error ? e.message : 'Checkpoint failed.',
      })
    }
  }

  return (
    <div className="border-hairline border-t">
      <ActionRow
        title="Reclaim space"
        description="Runs VACUUM — rewrites the database file, releasing any free pages back to disk."
        buttonLabel="Reclaim"
        state={vacuum}
        onRun={runVacuum}
      />
      <ActionRow
        title="Checkpoint WAL"
        description="Flushes the write-ahead log into the main database file and truncates the WAL."
        buttonLabel="Checkpoint"
        state={checkpoint}
        onRun={runCheckpoint}
      />
    </div>
  )
}

function ActionRow({
  title,
  description,
  buttonLabel,
  state,
  onRun,
}: {
  title: string
  description: string
  buttonLabel: string
  state: ActionState
  onRun: () => void
}) {
  const running = state.kind === 'running'
  return (
    <div className="border-hairline grid grid-cols-1 gap-3 border-b py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
      <div className="min-w-0">
        <p className="text-ink text-sm font-medium">{title}</p>
        <p className="text-ink-soft mt-1 text-sm leading-relaxed">
          {description}
        </p>
        {state.kind === 'ok' ? (
          <p className="text-ink-muted mt-2 text-xs">{state.message}</p>
        ) : null}
        {state.kind === 'err' ? (
          <p
            className="text-destructive mt-2 text-xs"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={running}
        onClick={onRun}
        className="justify-self-start sm:justify-self-end"
      >
        {running ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            Working…
          </>
        ) : (
          buttonLabel
        )}
      </Button>
    </div>
  )
}
