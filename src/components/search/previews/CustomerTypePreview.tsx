import { FieldList, FieldRow, PreviewShell } from '../PreviewShell'
import type { SearchItem } from '#/lib/search/types'

type Props = { item: Extract<SearchItem, { type: 'customer-type' }> }

export function CustomerTypePreview({ item }: Props) {
  const t = item.data
  return (
    <PreviewShell
      kicker={item.kicker}
      title={t.label}
      typeLine="Customer type"
      actionLabel="jump to list"
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
