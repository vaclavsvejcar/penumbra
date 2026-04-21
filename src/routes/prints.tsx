import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '#/components/PlaceholderPage'

export const Route = createFileRoute('/prints')({ component: Prints })

function Prints() {
  return (
    <PlaceholderPage
      kicker="Archive"
      title="Prints"
      description="Individual silver gelatin prints. Numbered, signed, placed."
    />
  )
}
