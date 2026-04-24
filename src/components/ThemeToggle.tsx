import { Monitor, Moon, Sun } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { type ThemeMode, useTheme } from './ThemeProvider'

const modes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'auto', label: 'System', icon: Monitor },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const satisfies ReadonlyArray<{
  value: ThemeMode
  label: string
  icon: typeof Sun
}>

function getTriggerIcon(mode: ThemeMode): typeof Sun {
  if (mode === 'auto') return Monitor
  return mode === 'dark' ? Moon : Sun
}

export default function ThemeToggle() {
  const { mode, setMode } = useTheme()

  function onValueChange(next: string) {
    if (next === 'light' || next === 'dark' || next === 'auto') {
      if (next !== mode) setMode(next)
    }
  }

  const TriggerIcon = getTriggerIcon(mode)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Theme"
        className="text-ink-soft hover:text-ink hover:bg-muted data-[state=open]:bg-muted data-[state=open]:text-ink inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors"
      >
        <TriggerIcon className="h-4 w-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" sideOffset={6}>
        <DropdownMenuRadioGroup value={mode} onValueChange={onValueChange}>
          {modes.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
