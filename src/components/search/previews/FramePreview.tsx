import { FieldList, FieldRow, PreviewShell } from '../PreviewShell'
import { negativeDisplayId } from '#/lib/negative-id'
import type { SearchItem } from '#/lib/search/types'

type Props = { item: Extract<SearchItem, { type: 'frame' }> }

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function FramePreview({ item }: Props) {
  const f = item.data
  return (
    <PreviewShell
      kicker={item.kicker}
      title={f.subject ?? `Frame ${String(f.frameNumber).padStart(2, '0')}`}
      typeLine={`Frame · roll ${negativeDisplayId(f.negative)}${f.keeper ? ' · keeper' : ''}`}
      actionLabel="open roll"
    >
      <FieldList>
        <FieldRow label="Frame" mono>
          {String(f.frameNumber).padStart(2, '0')}
        </FieldRow>
        {f.subject ? <FieldRow label="Subject">{f.subject}</FieldRow> : null}
        {f.dateShot ? (
          <FieldRow label="Shot" mono>
            {dateFmt.format(f.dateShot)}
          </FieldRow>
        ) : null}
        {f.notes ? (
          <FieldRow label="Notes">
            <span className="text-ink-soft whitespace-pre-wrap">{f.notes}</span>
          </FieldRow>
        ) : null}
      </FieldList>
    </PreviewShell>
  )
}
