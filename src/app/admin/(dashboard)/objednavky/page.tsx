import { getOrders, getOrderStats } from '@/actions/orders'
import { getPizzaDays } from '@/actions/pizza-days'
import { OrdersClient } from './orders-client'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ pizzaDayId?: string; status?: string; search?: string }>
}) {
  const filters = await searchParams
  const [orders, pizzaDays, stats] = await Promise.all([
    getOrders(filters),
    getPizzaDays(),
    getOrderStats(filters.pizzaDayId),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Objednávky</h1>
        <p className="mt-1 text-sm text-gray-500">Spravujte objednávky zákazníkov</p>
      </div>
      <OrdersClient
        initialOrders={orders}
        pizzaDays={pizzaDays}
        stats={stats}
        currentFilters={filters}
      />
    </div>
  )
}
