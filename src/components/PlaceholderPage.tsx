import { motion } from 'motion/react'

type PlaceholderPageProps = {
  kicker: string
  title: string
  description: string
}

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
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

export function PlaceholderPage({ kicker, title, description }: PlaceholderPageProps) {
  return (
    <motion.section
      className="py-16 sm:py-24"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <motion.p variants={item} className="kicker mb-4">
        {kicker}
      </motion.p>
      <motion.h1
        variants={item}
        className="font-serif text-ink mb-4 text-5xl leading-[0.95] font-normal tracking-tight italic sm:text-6xl"
      >
        {title}
      </motion.h1>
      <motion.p
        variants={item}
        className="text-ink-soft max-w-xl text-base leading-relaxed sm:text-lg"
      >
        {description}
      </motion.p>

      <motion.div
        variants={item}
        className="border-hairline mt-16 flex h-72 items-center justify-center rounded-md border border-dashed"
      >
        <p className="kicker text-ink-muted">Coming soon</p>
      </motion.div>
    </motion.section>
  )
}
