import { FieldList, FieldRow, PreviewShell } from '../PreviewShell'
import type { SearchItem } from '#/lib/search/types'

type Props = { item: Extract<SearchItem, { type: 'customer' }> }

export function CustomerPreview({ item }: Props) {
  const c = item.data
  return (
    <PreviewShell
      kicker={item.kicker}
      title={c.name}
      typeLine={`Customer · ${c.customerType.label}`}
      actionLabel="open customer"
    >
      <FieldList>
        {c.city ? <FieldRow label="City">{c.city}</FieldRow> : null}
        {c.email ? (
          <FieldRow label="Email" mono>
            {c.email}
          </FieldRow>
        ) : null}
        {c.phone ? (
          <FieldRow label="Phone" mono>
            {c.phone}
          </FieldRow>
        ) : null}
        {c.notes ? (
          <FieldRow label="Notes">
            <span className="text-ink-soft whitespace-pre-wrap">{c.notes}</span>
          </FieldRow>
        ) : null}
      </FieldList>
    </PreviewShell>
  )
}
