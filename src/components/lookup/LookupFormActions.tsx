import { Check } from 'lucide-react'
import { Button } from '#/components/ui/button'

type LookupFormActionsProps = {
  saving: boolean
  onCancel: () => void
  onSave: () => void
  submitLabel: string
  canSubmit: boolean
}

export function LookupFormActions({
  saving,
  onCancel,
  onSave,
  submitLabel,
  canSubmit,
}: LookupFormActionsProps) {
  return (
    <div className="ml-auto flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        disabled={saving}
      >
        Cancel
      </Button>
      <Button
        variant="safelight"
        size="sm"
        onClick={onSave}
        disabled={saving || !canSubmit}
      >
        <Check aria-hidden className="size-3.5" />
        <span>{submitLabel}</span>
      </Button>
    </div>
  )
}
