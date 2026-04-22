import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, Search } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import Sidebar from './Sidebar'
import { useSearch } from './SearchProvider'

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const search = useSearch()

  return (
    <header className="hairline-b bg-background/80 sticky top-0 z-40 flex items-center justify-between px-4 py-3 backdrop-blur-md md:hidden">
      <Link to="/" className="inline-flex items-baseline no-underline">
        <span
          aria-hidden
          className="text-safelight font-serif leading-none italic"
          style={{ fontSize: '1.85rem', letterSpacing: '-0.02em' }}
        >
          p
        </span>
        <span className="text-ink font-serif text-xl leading-none italic">
          enumbra
        </span>
        <span className="sr-only">penumbra</span>
      </Link>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={search.open}
          aria-label="Search the archive"
          className="text-ink-soft hover:text-ink inline-flex h-9 w-9 items-center justify-center rounded-sm transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open navigation menu"
              className="text-ink-soft hover:text-ink inline-flex h-9 w-9 items-center justify-center rounded-sm transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 border-r p-0 [&>button]:hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <Sidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
