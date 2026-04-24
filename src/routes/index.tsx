import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '#/lib/utils'
import { type ThemeMode, useTheme } from '#/components/ThemeProvider'
import { getNavCounts } from '#/server/navCounts'

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => ({
    stats: await getNavCounts(),
  }),
})

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
}

function Home() {
  const { stats } = Route.useLoaderData()

  return (
    <motion.section
      className="relative py-16 sm:py-24"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/4 -z-10 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, var(--safelight-soft) 0%, transparent 55%)',
        }}
      />

      <motion.p variants={item} className="kicker mb-6">
        N° 01 · Dashboard
      </motion.p>

      <motion.h1
        variants={item}
        className="font-serif text-ink mb-8 text-[clamp(3.5rem,10vw,10rem)] leading-[0.9] font-normal tracking-tight italic"
      >
        penumbra
      </motion.h1>

      <motion.p
        variants={item}
        className="text-ink-soft max-w-xl text-lg leading-relaxed sm:text-xl"
      >
        An inventory of negatives, darkroom enlargements, and
        limited&nbsp;editions. Kept honest, kept quiet.
      </motion.p>

      <motion.div
        variants={item}
        className="border-hairline mt-16 grid grid-cols-3 border-t"
      >
        <Stat label="Negatives" value={stats.negatives} to="/negatives" />
        <Stat label="Editions" value={null} to="/editions" />
        <Stat label="Prints" value={null} to="/prints" />
      </motion.div>

      <motion.div variants={item} className="mt-24 sm:mt-32">
        <p className="kicker mb-6">N° 02 · Colophon</p>

        <div className="border-hairline space-y-3 border-t pt-3 text-sm">
          <p className="text-ink-soft max-w-xl">
            Set in <em className="text-ink font-serif">Instrument Serif</em>,{' '}
            <span className="text-ink">Geist</span>, and{' '}
            <span className="text-ink font-mono text-[0.95em]">Geist Mono</span>
            .
          </p>

          <p className="text-ink-soft max-w-xl">
            <a
              href="https://github.com/vaclavsvejcar/penumbra"
              target="_blank"
              rel="noreferrer"
              className="text-ink hover:text-safelight inline-flex items-baseline gap-0.5 transition-colors"
            >
              Source on GitHub
              <ArrowUpRight
                className="h-3 w-3 self-center"
                strokeWidth={1.5}
                aria-hidden
              />
            </a>
            <span className="text-ink-muted mx-2">·</span>
            <span className="text-ink-muted font-mono text-[0.85em] tabular-nums">
              v0.1.0
            </span>
          </p>

          <ThemeSpecimen />
        </div>
      </motion.div>
    </motion.section>
  )
}

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'auto', label: 'System' },
  { value: 'dark', label: 'Dark' },
] as const satisfies ReadonlyArray<{ value: ThemeMode; label: string }>

function ThemeSpecimen() {
  const { mode, setMode } = useTheme()
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="kicker">Appearance</span>
      <div className="flex items-center gap-1">
        {themeOptions.map((opt) => {
          const isActive = opt.value === mode
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                if (!isActive) setMode(opt.value)
              }}
              className={cn(
                'rounded-sm px-2 py-0.5 transition-colors',
                isActive
                  ? 'bg-muted text-ink'
                  : 'text-ink-muted hover:bg-muted/50 hover:text-ink',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  to,
}: {
  label: string
  value: number | null
  to: string
}) {
  return (
    <Link
      to={to}
      className="group border-hairline hover:bg-muted/40 first:border-l-0 border-l py-5 pl-6 transition-colors first:pl-0"
    >
      <p className="kicker group-hover:text-ink mb-2 transition-colors">
        {label}
      </p>
      <p className="font-mono text-ink text-3xl tabular-nums">
        {value ?? '—'}
      </p>
    </Link>
  )
}
