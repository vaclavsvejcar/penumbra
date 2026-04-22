import { FieldList, FieldRow, PreviewShell } from '../PreviewShell'
import type { SearchItem } from '#/lib/search/types'

type Props = { item: Extract<SearchItem, { type: 'navigation' }> }

export function NavigationPreview({ item }: Props) {
  return (
    <PreviewShell
      kicker={item.kicker}
      groupLabel="Jump to"
      title={item.title}
      actionLabel="open"
    >
      <FieldList>
        <FieldRow label="Section" mono>
          {item.data.group}
        </FieldRow>
        <FieldRow label="Path" mono>
          {item.data.href}
        </FieldRow>
      </FieldList>
    </PreviewShell>
  )
}
