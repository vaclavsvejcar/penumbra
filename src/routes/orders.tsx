import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '#/components/PlaceholderPage'

export const Route = createFileRoute('/orders')({ component: Orders })

function Orders() {
  return (
    <PlaceholderPage
      kicker="Orders"
      title="Orders"
      description="From inquiry to shipped print. Status, invoices, handover."
    />
  )
}
