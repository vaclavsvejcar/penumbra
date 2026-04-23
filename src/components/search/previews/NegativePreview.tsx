import { FieldList, FieldRow, PreviewShell } from '../PreviewShell'
import type { SearchItem } from '#/lib/search/types'

type Props = { item: Extract<SearchItem, { type: 'negative' }> }

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function NegativePreview({ item }: Props) {
  const n = item.data
  const fs = n.filmStock
  return (
    <PreviewShell
      kicker={`Roll · ${item.title}`}
      title={`${fs.manufacturer.label} ${fs.label}`}
      typeLine={n.archivedAt ? 'Archived roll' : 'Negative roll'}
      actionLabel="open roll"
    >
      <FieldList>
        <FieldRow label="ID" mono>
          {item.title}
        </FieldRow>
        <FieldRow label="ISO" mono>
          {fs.iso}
        </FieldRow>
        <FieldRow label="Developed" mono>
          {dateFmt.format(n.developedAt)}
        </FieldRow>
        {n.developer ? (
          <FieldRow label="Developer">
            {n.developer.manufacturer.label} {n.developer.label}
          </FieldRow>
        ) : null}
        {n.devNotes ? (
          <FieldRow label="Notes">
            <span className="text-ink-soft whitespace-pre-wrap">
              {n.devNotes}
            </span>
          </FieldRow>
        ) : null}
      </FieldList>
    </PreviewShell>
  )
}
