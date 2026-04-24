import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'

type ThemeMode = 'light' | 'dark' | 'auto'

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'auto'
  }

  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored
  }

  return 'auto'
}

function applyThemeMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode

  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)

  if (mode === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }

  document.documentElement.style.colorScheme = resolved
}

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
  const [mode, setMode] = useState<ThemeMode>('auto')

  useEffect(() => {
    const initialMode = getInitialMode()
    setMode(initialMode)
    applyThemeMode(initialMode)
  }, [])

  useEffect(() => {
    if (mode !== 'auto') {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('auto')

    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [mode])

  function selectMode(next: string) {
    if (next !== 'light' && next !== 'dark' && next !== 'auto') {
      return
    }
    if (next === mode) {
      return
    }
    setMode(next)
    applyThemeMode(next)
    window.localStorage.setItem('theme', next)
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
        <DropdownMenuRadioGroup value={mode} onValueChange={selectMode}>
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
