import type { SearchItem } from '#/lib/search/types'
import { NavigationPreview } from './previews/NavigationPreview'
import { CustomerPreview } from './previews/CustomerPreview'
import { CustomerTypePreview } from './previews/CustomerTypePreview'
import { ManufacturerPreview } from './previews/ManufacturerPreview'
import { FilmStockPreview } from './previews/FilmStockPreview'
import { PaperStockPreview } from './previews/PaperStockPreview'
import { DeveloperPreview } from './previews/DeveloperPreview'
import { DeveloperDilutionPreview } from './previews/DeveloperDilutionPreview'
import { NegativePreview } from './previews/NegativePreview'
import { FramePreview } from './previews/FramePreview'

type Props = { item: SearchItem | null }

export function SearchPreviewPane({ item }: Props) {
  if (!item) {
    return (
      <div className="flex h-full items-center justify-center px-8 py-10">
        <p className="text-ink-muted font-serif text-base italic">
          Select an entry to preview.
        </p>
      </div>
    )
  }

  switch (item.type) {
    case 'navigation':
      return <NavigationPreview item={item} />
    case 'customer':
      return <CustomerPreview item={item} />
    case 'customer-type':
      return <CustomerTypePreview item={item} />
    case 'manufacturer':
      return <ManufacturerPreview item={item} />
    case 'film-stock':
      return <FilmStockPreview item={item} />
    case 'paper-stock':
      return <PaperStockPreview item={item} />
    case 'developer':
      return <DeveloperPreview item={item} />
    case 'developer-dilution':
      return <DeveloperDilutionPreview item={item} />
    case 'negative':
      return <NegativePreview item={item} />
    case 'frame':
      return <FramePreview item={item} />
  }
}
