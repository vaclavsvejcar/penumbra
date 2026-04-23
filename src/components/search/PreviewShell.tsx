import { CornerDownLeft } from 'lucide-react'
import type { ReactNode } from 'react'

type PreviewShellProps = {
  kicker: string
  title: string
  typeLine: ReactNode
  children: ReactNode
  actionLabel: string
}

export function PreviewShell({
  kicker,
  title,
  typeLine,
  children,
  actionLabel,
}: PreviewShellProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-8 py-7">
        <p className="text-ink-muted font-mono text-[0.7rem] tracking-[0.18em]">
          {kicker}
        </p>
        <h3 className="text-ink mt-1 font-serif text-3xl leading-tight italic">
          {title}
        </h3>
        <p className="text-ink-soft mt-2 text-[0.8rem]">{typeLine}</p>
        <div className="border-hairline mt-6 border-t pt-5">{children}</div>
      </div>
      <div className="border-hairline flex items-center gap-3 border-t px-8 py-3">
        <span className="text-ink-muted inline-flex items-center gap-1.5 font-mono text-[0.72rem]">
          <CornerDownLeft className="h-3 w-3" aria-hidden />
          {actionLabel}
        </span>
        <span className="text-ink-muted font-mono text-[0.72rem]">
          <span className="mr-1">⌘⏎</span>new tab
        </span>
      </div>
    </div>
  )
}

type FieldRowProps = {
  label: string
  children: ReactNode
  mono?: boolean
}

export function FieldRow({ label, children, mono }: FieldRowProps) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-baseline gap-4 py-1.5">
      <dt className="text-ink-muted text-[0.72rem] tracking-[0.14em] uppercase">
        {label}
      </dt>
      <dd
        className={
          mono ? 'text-ink font-mono text-sm tabular-nums' : 'text-ink text-sm'
        }
      >
        {children}
      </dd>
    </div>
  )
}

export function FieldList({ children }: { children: ReactNode }) {
  return <dl className="space-y-0">{children}</dl>
}
