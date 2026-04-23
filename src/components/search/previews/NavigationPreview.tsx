import { FieldList, FieldRow, PreviewShell } from '../PreviewShell'
import type { SearchItem } from '#/lib/search/types'

type Props = { item: Extract<SearchItem, { type: 'navigation' }> }

export function NavigationPreview({ item }: Props) {
  return (
    <PreviewShell
      kicker={item.kicker}
      title={item.title}
      typeLine={`Jump to · ${item.data.group}`}
      actionLabel="open"
    >
      <FieldList>
        <FieldRow label="Path" mono>
          {item.data.href}
        </FieldRow>
      </FieldList>
    </PreviewShell>
  )
}
