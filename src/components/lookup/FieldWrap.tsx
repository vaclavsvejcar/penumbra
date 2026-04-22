import { Label } from '#/components/ui/label'

type FieldWrapProps = {
  htmlFor: string
  label: string
  children: React.ReactNode
}

export function FieldWrap({ htmlFor, label, children }: FieldWrapProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="kicker">
        {label}
      </Label>
      {children}
    </div>
  )
}
