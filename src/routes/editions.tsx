import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '#/components/PlaceholderPage'

export const Route = createFileRoute('/editions')({ component: Editions })

function Editions() {
  return (
    <PlaceholderPage
      kicker="Archive"
      title="Editions"
      description="Limited runs — the concept, the number, the story."
    />
  )
}
