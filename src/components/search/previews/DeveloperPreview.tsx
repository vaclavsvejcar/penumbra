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
      groupLabel="Developer"
      title={d.label}
      subtitle={d.manufacturer.label}
      actionLabel="open list"
    >
      <FieldList>
        <FieldRow label="Maker">{d.manufacturer.label}</FieldRow>
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
