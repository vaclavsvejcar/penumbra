import { Plus } from 'lucide-react'
import { Button } from '#/components/ui/button'

type LookupHeaderProps = {
  kicker?: string
  title: string
  description: string
  addLabel: string
  onAdd: () => void
  addDisabled?: boolean
}

export function LookupHeader({
  kicker = 'Lookup',
  title,
  description,
  addLabel,
  onAdd,
  addDisabled,
}: LookupHeaderProps) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="kicker mb-1.5">{kicker}</p>
        <h2 className="font-serif text-ink text-2xl leading-tight italic">
          {title}
        </h2>
        <p className="text-ink-soft mt-2 max-w-xl text-sm leading-relaxed">
          {description}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onAdd}
        disabled={addDisabled}
        className="shrink-0"
      >
        <Plus aria-hidden className="size-4" />
        {addLabel}
      </Button>
    </div>
  )
}
