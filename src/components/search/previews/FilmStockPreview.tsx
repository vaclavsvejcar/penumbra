import { FieldList, FieldRow, PreviewShell } from '../PreviewShell'
import type { SearchItem } from '#/lib/search/types'

type Props = { item: Extract<SearchItem, { type: 'film-stock' }> }

const TYPE_LABELS: Record<string, string> = {
  bw: 'Black & white',
  color_neg: 'Color negative',
  slide: 'Slide',
}

const PROCESS_LABELS: Record<string, string> = {
  bw: 'B&W',
  c41: 'C-41',
  e6: 'E-6',
  bw_reversal: 'B&W reversal',
}

export function FilmStockPreview({ item }: Props) {
  const s = item.data
  return (
    <PreviewShell
      kicker={item.kicker}
      title={s.label}
      typeLine={`Film stock · ${s.manufacturer.label}`}
      actionLabel="jump to list"
    >
      <FieldList>
        <FieldRow label="Code" mono>
          {s.code}
        </FieldRow>
        <FieldRow label="ISO" mono>
          {s.iso}
        </FieldRow>
        <FieldRow label="Type">{TYPE_LABELS[s.type] ?? s.type}</FieldRow>
        <FieldRow label="Process">
          {PROCESS_LABELS[s.process] ?? s.process}
        </FieldRow>
      </FieldList>
    </PreviewShell>
  )
}
