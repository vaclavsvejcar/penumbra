import type { SearchItem } from './types'

type NavSpec = {
  title: string
  href: string
  group: string
  subtitle?: string
  keywords?: string
}

const NAV: ReadonlyArray<NavSpec> = [
  { title: 'Dashboard', href: '/', group: 'Main', keywords: 'home index overview' },
  { title: 'Negatives', href: '/negatives', group: 'Archive' },
  { title: 'Editions', href: '/editions', group: 'Archive' },
  { title: 'Prints', href: '/prints', group: 'Archive' },
  { title: 'Customers', href: '/customers', group: 'Orders' },
  { title: 'Orders', href: '/orders', group: 'Orders' },
  { title: 'Lookups', href: '/lookups', group: 'Settings' },
  {
    title: 'Customer types',
    href: '/lookups/customer-types',
    group: 'Settings',
    subtitle: 'Lookup',
  },
  {
    title: 'Manufacturers',
    href: '/lookups/manufacturers',
    group: 'Settings',
    subtitle: 'Lookup',
  },
  {
    title: 'Film stocks',
    href: '/lookups/film-stocks',
    group: 'Settings',
    subtitle: 'Lookup',
  },
  {
    title: 'Paper stocks',
    href: '/lookups/paper-stocks',
    group: 'Settings',
    subtitle: 'Lookup',
  },
  {
    title: 'Developers',
    href: '/lookups/developers',
    group: 'Settings',
    subtitle: 'Lookup',
  },
  {
    title: 'Developer dilutions',
    href: '/lookups/developer-dilutions',
    group: 'Settings',
    subtitle: 'Lookup',
  },
  { title: 'Storage', href: '/storage', group: 'Settings' },
]

export function buildNavigationItems(): SearchItem[] {
  return NAV.map((n, i) => ({
    type: 'navigation' as const,
    id: n.href,
    title: n.title,
    kicker: `N° ${String(i + 1).padStart(2, '0')}`,
    subtitle: n.subtitle ?? n.group,
    searchText: [n.title, n.group, n.subtitle, n.keywords]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
    data: { href: n.href, group: n.group },
  }))
}
