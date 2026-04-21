import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '#/components/PlaceholderPage'

export const Route = createFileRoute('/customers')({ component: Customers })

function Customers() {
  return (
    <PlaceholderPage
      kicker="Orders"
      title="Customers"
      description="Collectors and galleries. Names behind the prints."
    />
  )
}
