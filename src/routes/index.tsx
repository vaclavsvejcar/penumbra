import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'motion/react'

export const Route = createFileRoute('/')({ component: Home })

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
        <Stat label="Negatives" value="—" to="/negatives" />
        <Stat label="Editions" value="—" to="/editions" />
        <Stat label="Prints" value="—" to="/prints" />
      </motion.div>
    </motion.section>
  )
}

function Stat({
  label,
  value,
  to,
}: {
  label: string
  value: string
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
      <p className="font-mono text-ink text-3xl tabular-nums">{value}</p>
    </Link>
  )
}
