import { getOrder } from '@/actions/orders'
import { notFound } from 'next/navigation'
import { OrderConfirmationClient } from './order-confirmation-client'

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const order = await getOrder(orderId)

  if (!order) notFound()

  return <OrderConfirmationClient initialOrder={order} />
}
