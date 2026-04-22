import { Archive, Pencil, RotateCcw } from 'lucide-react'
import { Button } from '#/components/ui/button'

type LookupRowActionsProps = {
  label: string
  archived: boolean
  busy: boolean
  onEdit: () => void
  onArchive: () => void
  onUnarchive: () => void
}

export function LookupRowActions({
  label,
  archived,
  busy,
  onEdit,
  onArchive,
  onUnarchive,
}: LookupRowActionsProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        disabled={busy}
        aria-label={`Edit ${label}`}
      >
        <Pencil aria-hidden className="size-3.5" />
      </Button>
      {archived ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onUnarchive}
          disabled={busy}
          aria-label={`Restore ${label}`}
        >
          <RotateCcw aria-hidden className="size-3.5" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={onArchive}
          disabled={busy}
          aria-label={`Archive ${label}`}
        >
          <Archive aria-hidden className="size-3.5" />
        </Button>
      )}
    </>
  )
}
