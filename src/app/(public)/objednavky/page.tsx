import { getCustomerOrders } from '@/actions/customer-profile'
import { OrderHistoryClient } from './order-history-client'

export default async function OrderHistoryPage() {
  const orders = await getCustomerOrders()

  return <OrderHistoryClient orders={orders} />
}
