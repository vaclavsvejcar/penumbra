import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { SearchPalette } from './SearchPalette'

type SearchContextValue = {
  open: () => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext)
  if (!ctx) {
    throw new Error('useSearch must be used inside <SearchProvider />')
  }
  return ctx
}

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return false
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented) return

      // Universal opener, works anywhere including inside inputs.
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        return
      }

      // Typing-first opener, suppressed when the user is typing into a field.
      if (
        e.key === '/' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isEditableTarget(e.target)
      ) {
        e.preventDefault()
        setIsOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const value = useMemo<SearchContextValue>(() => ({ open }), [open])

  return (
    <SearchContext.Provider value={value}>
      {children}
      <SearchPalette open={isOpen} onOpenChange={setIsOpen} />
    </SearchContext.Provider>
  )
}
