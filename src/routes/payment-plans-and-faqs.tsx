import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/payment-plans-and-faqs')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/payment-plans-and-faqs"!</div>
}
