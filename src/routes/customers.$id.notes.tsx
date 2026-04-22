import {
  createFileRoute,
  getRouteApi,
  useRouter,
} from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import { updateCustomer } from '#/server/customers'

export const Route = createFileRoute('/customers/$id/notes')({
  component: CustomerNotes,
})

const parent = getRouteApi('/customers/$id')

const item = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

function CustomerNotes() {
  const { customer } = parent.useLoaderData()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(customer.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEditing() {
    setValue(customer.notes ?? '')
    setError(null)
    setIsEditing(true)
  }

  function cancelEditing() {
    setValue(customer.notes ?? '')
    setError(null)
    setIsEditing(false)
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await updateCustomer({ data: { id: customer.id, notes: value } })
      await router.invalidate()
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (isEditing) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={item}
        className="space-y-4"
      >
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={14}
          autoFocus
          placeholder="Anything worth remembering about this customer…"
          className="text-sm leading-relaxed"
        />
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={cancelEditing}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save notes'}
          </Button>
        </div>
      </motion.div>
    )
  }

  if (!customer.notes) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={item}
        className="space-y-4"
      >
        <div className="border-hairline flex h-48 flex-col items-center justify-center gap-3 rounded-md border border-dashed">
          <p className="kicker text-ink-muted">No notes yet</p>
          <p className="text-ink-soft font-serif text-lg italic">
            The margins are blank.
          </p>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Plus aria-hidden className="size-4" />
            Add notes
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={item}
      className="flex items-start justify-between gap-6"
    >
      <article className="text-ink max-w-2xl flex-1 text-sm leading-relaxed whitespace-pre-wrap">
        {customer.notes}
      </article>
      <Button
        variant="outline"
        size="sm"
        onClick={startEditing}
        className="shrink-0"
      >
        <Pencil aria-hidden className="size-4" />
        Edit
      </Button>
    </motion.div>
  )
}
