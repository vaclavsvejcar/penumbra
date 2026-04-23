import type {
  Customer,
  CustomerType,
  CustomerWithType,
  Developer,
  DeveloperWithManufacturer,
  FilmStock,
  FilmStockWithManufacturer,
  FrameSearchItem,
  Manufacturer,
  NegativeSearchItem,
  PaperStock,
  PaperStockWithManufacturer,
} from '#/db/schema'

export type NavigationData = {
  href: string
  group: string
}

export type SearchItem =
  | {
      type: 'navigation'
      id: string
      title: string
      kicker: string
      subtitle?: string
      searchText: string
      data: NavigationData
    }
  | {
      type: 'customer'
      id: number
      title: string
      kicker: string
      subtitle?: string
      searchText: string
      data: CustomerWithType
    }
  | {
      type: 'customer-type'
      id: number
      title: string
      kicker: string
      subtitle?: string
      searchText: string
      data: CustomerType
    }
  | {
      type: 'manufacturer'
      id: number
      title: string
      kicker: string
      subtitle?: string
      searchText: string
      data: Manufacturer
    }
  | {
      type: 'film-stock'
      id: number
      title: string
      kicker: string
      subtitle?: string
      searchText: string
      data: FilmStockWithManufacturer
    }
  | {
      type: 'paper-stock'
      id: number
      title: string
      kicker: string
      subtitle?: string
      searchText: string
      data: PaperStockWithManufacturer
    }
  | {
      type: 'developer'
      id: number
      title: string
      kicker: string
      subtitle?: string
      searchText: string
      data: DeveloperWithManufacturer
    }
  | {
      type: 'negative'
      id: number
      title: string
      kicker: string
      subtitle?: string
      searchText: string
      data: NegativeSearchItem
    }
  | {
      type: 'frame'
      id: number
      title: string
      kicker: string
      subtitle?: string
      searchText: string
      data: FrameSearchItem
    }

export type SearchItemType = SearchItem['type']

export type ScopeDef = {
  code: string
  itemType: SearchItemType
  label: string
  groupLabel: string
}

export type RecentRef = {
  type: SearchItemType
  id: SearchItem['id']
}

export type ScoredItem = {
  item: SearchItem
  score: number
}

export type ResultGroup = {
  itemType: SearchItemType
  label: string
  items: Array<SearchItem>
}

// Re-exports so preview components don't reach into #/db/schema themselves.
export type {
  Customer,
  CustomerType,
  CustomerWithType,
  Developer,
  DeveloperWithManufacturer,
  FilmStock,
  FilmStockWithManufacturer,
  FrameSearchItem,
  Manufacturer,
  NegativeSearchItem,
  PaperStock,
  PaperStockWithManufacturer,
}
