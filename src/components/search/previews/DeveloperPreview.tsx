import { FieldList, FieldRow, PreviewShell } from '../PreviewShell'
import type { SearchItem } from '#/lib/search/types'

type Props = { item: Extract<SearchItem, { type: 'developer' }> }

const APPLIES_LABELS: Record<string, string> = {
  film: 'Film',
  paper: 'Paper',
  both: 'Film & paper',
}

const FORM_LABELS: Record<string, string> = {
  liquid: 'Liquid',
  powder: 'Powder',
  monobath: 'Monobath',
}

export function DeveloperPreview({ item }: Props) {
  const d = item.data
  return (
    <PreviewShell
      kicker={item.kicker}
      title={d.label}
      typeLine={`Developer · ${d.manufacturer.label}`}
      actionLabel="jump to list"
    >
      <FieldList>
        <FieldRow label="Code" mono>
          {d.code}
        </FieldRow>
        <FieldRow label="Applies to">
          {APPLIES_LABELS[d.appliesTo] ?? d.appliesTo}
        </FieldRow>
        <FieldRow label="Form">{FORM_LABELS[d.form] ?? d.form}</FieldRow>
      </FieldList>
    </PreviewShell>
  )
}
