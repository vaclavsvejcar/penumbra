import { FieldList, FieldRow, PreviewShell } from '../PreviewShell'
import type { SearchItem } from '#/lib/search/types'

type Props = { item: Extract<SearchItem, { type: 'command' }> }

export function CommandPreview({ item }: Props) {
  if (item.data.kind === 'options') {
    const { options, detail, activeOptionLabel } = item.data
    return (
      <PreviewShell
        kicker={item.kicker}
        title={item.title}
        typeLine={`Command · ${item.subtitle ?? 'Action'}`}
        actionLabel="browse"
      >
        <FieldList>
          {detail ? <FieldRow label="Action">{detail}</FieldRow> : null}
          <FieldRow label="Options">
            {options.map((opt) => opt.title).join(', ')}
          </FieldRow>
          {activeOptionLabel ? (
            <FieldRow label="Current">{activeOptionLabel}</FieldRow>
          ) : null}
        </FieldList>
      </PreviewShell>
    )
  }

  return (
    <PreviewShell
      kicker={item.kicker}
      title={item.title}
      typeLine={`Command · ${item.subtitle ?? 'Action'}`}
      actionLabel="run"
    >
      <FieldList>
        {item.data.detail ? (
          <FieldRow label="Action">{item.data.detail}</FieldRow>
        ) : null}
        <FieldRow label="State">
          {item.data.isActive ? 'Currently active' : 'Available'}
        </FieldRow>
      </FieldList>
    </PreviewShell>
  )
}
