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
      title={s.label}
      typeLine={`Paper stock · ${s.manufacturer.label}`}
      actionLabel="jump to list"
    >
      <FieldList>
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
