import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '#/components/PlaceholderPage'

export const Route = createFileRoute('/negatives')({ component: Negatives })

function Negatives() {
  return (
    <PlaceholderPage
      kicker="Archive"
      title="Negatives"
      description="The roll log. Scanned frames, contact sheets, chronology."
    />
  )
}
