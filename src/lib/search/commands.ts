import type { ThemeMode } from '#/components/ThemeProvider'
import type { CommandOptionItem, SearchItem } from './types'

export type CommandContext = {
  setTheme: (next: ThemeMode) => void
  currentTheme: ThemeMode
}

type ThemeOptionSpec = {
  value: ThemeMode
  label: string
  detail: string
  keywords: string
}

const THEME_OPTIONS: ReadonlyArray<ThemeOptionSpec> = [
  {
    value: 'light',
    label: 'Light',
    detail: 'Switch to the light appearance.',
    keywords: 'light bright paper',
  },
  {
    value: 'auto',
    label: 'System',
    detail: 'Follow the OS appearance preference.',
    keywords: 'system auto follow os',
  },
  {
    value: 'dark',
    label: 'Dark',
    detail: 'Switch to the dark appearance.',
    keywords: 'dark night ink',
  },
]

function themeLabel(mode: ThemeMode): string {
  return THEME_OPTIONS.find((o) => o.value === mode)?.label ?? mode
}

function buildThemeOptions(ctx: CommandContext): CommandOptionItem[] {
  return THEME_OPTIONS.map((opt, i) => {
    const active = ctx.currentTheme === opt.value
    return {
      type: 'command',
      id: `theme.${opt.value}`,
      title: opt.label,
      kicker: `N° ${String(i + 1).padStart(2, '0')}`,
      subtitle: active ? 'Active' : undefined,
      searchText: [opt.label, opt.keywords, 'theme appearance']
        .join(' ')
        .toLowerCase(),
      data: {
        kind: 'run',
        run: () => ctx.setTheme(opt.value),
        detail: opt.detail,
        isActive: active,
      },
    }
  })
}

export function buildCommandItems(ctx: CommandContext): SearchItem[] {
  const themeOptions = buildThemeOptions(ctx)

  return [
    {
      type: 'command',
      id: 'theme',
      title: 'Theme',
      kicker: 'N° 01',
      subtitle: `Appearance · ${themeLabel(ctx.currentTheme)}`,
      searchText: 'theme appearance mode light dark system auto night bright',
      data: {
        kind: 'options',
        options: themeOptions,
        detail: 'Pick the interface appearance.',
        activeOptionLabel: themeLabel(ctx.currentTheme),
      },
    },
  ]
}
