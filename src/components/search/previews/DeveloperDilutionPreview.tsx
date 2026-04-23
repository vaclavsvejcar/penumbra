import { FieldList, FieldRow, PreviewShell } from '../PreviewShell'
import type { SearchItem } from '#/lib/search/types'

type Props = { item: Extract<SearchItem, { type: 'developer-dilution' }> }

export function DeveloperDilutionPreview({ item }: Props) {
  const d = item.data
  return (
    <PreviewShell
      kicker={item.kicker}
      title={d.label}
      typeLine={`Dilution · ${d.developer.manufacturer.label} ${d.developer.label}`}
      actionLabel="jump to list"
    >
      <FieldList>
        <FieldRow label="Code" mono>
          {d.code}
        </FieldRow>
        <FieldRow label="Developer">
          {d.developer.manufacturer.label} {d.developer.label}
        </FieldRow>
      </FieldList>
    </PreviewShell>
  )
}
