import { ConfirmDialog } from '#/components/ConfirmDialog'

type LookupArchiveConfirmProps = {
  pending: { id: number; label: string } | null
  entityLabel: string
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}

export function LookupArchiveConfirm({
  pending,
  entityLabel,
  onCancel,
  onConfirm,
}: LookupArchiveConfirmProps) {
  return (
    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
      kicker="Archive"
      title={
        pending ? (
          <>
            Archive {entityLabel} <em>“{pending.label}”</em>?
          </>
        ) : (
          ''
        )
      }
      description="It stays in the archive but is hidden from pickers and lists. You can restore it any time."
      confirmLabel="Archive"
      tone="destructive"
      onConfirm={onConfirm}
    />
  )
}
