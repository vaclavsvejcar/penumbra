import { FieldList, FieldRow, PreviewShell } from '../PreviewShell'
import type { SearchItem } from '#/lib/search/types'

type Props = { item: Extract<SearchItem, { type: 'customer-type' }> }

export function CustomerTypePreview({ item }: Props) {
  const t = item.data
  return (
    <PreviewShell
      kicker={item.kicker}
      groupLabel="Customer type"
      title={t.label}
      actionLabel="open list"
    >
      <FieldList>
        <FieldRow label="Code" mono>
          {t.code}
        </FieldRow>
        <FieldRow label="Sort" mono>
          {t.sortOrder}
        </FieldRow>
      </FieldList>
    </PreviewShell>
  )
}
