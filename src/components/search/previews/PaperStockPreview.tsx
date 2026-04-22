import { FieldList, FieldRow, PreviewShell } from '../PreviewShell'
import type { SearchItem } from '#/lib/search/types'

type Props = { item: Extract<SearchItem, { type: 'paper-stock' }> }

const BASE_LABELS: Record<string, string> = {
  rc: 'Resin-coated',
  fb: 'Fibre-based',
}

export function PaperStockPreview({ item }: Props) {
  const s = item.data
  return (
    <PreviewShell
      kicker={item.kicker}
      groupLabel="Paper stock"
      title={s.label}
      subtitle={s.manufacturer.label}
      actionLabel="open list"
    >
      <FieldList>
        <FieldRow label="Maker">{s.manufacturer.label}</FieldRow>
        <FieldRow label="Code" mono>
          {s.code}
        </FieldRow>
        <FieldRow label="Base">{BASE_LABELS[s.base] ?? s.base}</FieldRow>
        <FieldRow label="Tone">{s.tone}</FieldRow>
        <FieldRow label="Contrast">{s.contrast}</FieldRow>
        {s.grade !== null ? (
          <FieldRow label="Grade" mono>
            {s.grade}
          </FieldRow>
        ) : null}
      </FieldList>
    </PreviewShell>
  )
}
