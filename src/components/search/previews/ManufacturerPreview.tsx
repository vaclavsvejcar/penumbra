import { FieldList, FieldRow, PreviewShell } from '../PreviewShell'
import type { SearchItem } from '#/lib/search/types'

type Props = { item: Extract<SearchItem, { type: 'manufacturer' }> }

export function ManufacturerPreview({ item }: Props) {
  const m = item.data
  return (
    <PreviewShell
      kicker={item.kicker}
      title={m.label}
      typeLine="Manufacturer"
      actionLabel="jump to list"
    >
      <FieldList>
        <FieldRow label="Code" mono>
          {m.code}
        </FieldRow>
        <FieldRow label="Sort" mono>
          {m.sortOrder}
        </FieldRow>
      </FieldList>
    </PreviewShell>
  )
}
