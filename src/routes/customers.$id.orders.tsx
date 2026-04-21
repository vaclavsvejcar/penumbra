import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'

export const Route = createFileRoute('/customers/$id/orders')({
  component: CustomerOrders,
})

const item = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

function CustomerOrders() {
  return (
    <motion.div initial="hidden" animate="visible" variants={item}>
      <div className="border-hairline flex h-72 flex-col items-center justify-center gap-3 rounded-md border border-dashed">
        <p className="kicker text-ink-muted">No orders yet</p>
        <p className="text-ink-soft font-serif text-xl italic">Coming soon.</p>
      </div>
    </motion.div>
  )
}
