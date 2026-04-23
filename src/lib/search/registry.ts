import type { ScopeDef, SearchItemType } from './types'

export const SCOPES: ReadonlyArray<ScopeDef> = [
  { code: 'go', itemType: 'navigation', label: 'Jump to', groupLabel: 'Jump to' },
  { code: 'neg', itemType: 'negative', label: 'Negatives', groupLabel: 'Negatives' },
  { code: 'frame', itemType: 'frame', label: 'Frames', groupLabel: 'Frames' },
  { code: 'cust', itemType: 'customer', label: 'Customers', groupLabel: 'Customers' },
  { code: 'film', itemType: 'film-stock', label: 'Film stocks', groupLabel: 'Film stocks' },
  { code: 'paper', itemType: 'paper-stock', label: 'Paper stocks', groupLabel: 'Paper stocks' },
  { code: 'dev', itemType: 'developer', label: 'Developers', groupLabel: 'Developers' },
  { code: 'dil', itemType: 'developer-dilution', label: 'Dilutions', groupLabel: 'Dilutions' },
  { code: 'mfr', itemType: 'manufacturer', label: 'Manufacturers', groupLabel: 'Manufacturers' },
  { code: 'ctype', itemType: 'customer-type', label: 'Customer types', groupLabel: 'Customer types' },
]

const BY_CODE = new Map(SCOPES.map((s) => [s.code, s]))
const BY_TYPE = new Map(SCOPES.map((s) => [s.itemType, s]))

export function findScopeByCode(code: string): ScopeDef | undefined {
  return BY_CODE.get(code.toLowerCase())
}

export function findScopeByType(type: SearchItemType): ScopeDef | undefined {
  return BY_TYPE.get(type)
}

export function groupLabelFor(type: SearchItemType): string {
  return BY_TYPE.get(type)?.groupLabel ?? type
}

// Display order of groups in the results list when showing global results.
export const GROUP_ORDER: ReadonlyArray<SearchItemType> = [
  'navigation',
  'negative',
  'frame',
  'customer',
  'film-stock',
  'paper-stock',
  'developer',
  'developer-dilution',
  'manufacturer',
  'customer-type',
]
