import { getOrders, getOrderStats } from '@/actions/orders'
import { getPizzaDays } from '@/actions/pizza-days'
import { getTimeSlots } from '@/actions/time-slots'
import { OrdersClient } from './orders-client'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ pizzaDayId?: string; status?: string; search?: string; timeSlotId?: string }>
}) {
  const filters = await searchParams
  const [orders, pizzaDays, stats, timeSlots] = await Promise.all([
    getOrders(filters),
    getPizzaDays(),
    getOrderStats(filters.pizzaDayId),
    filters.pizzaDayId ? getTimeSlots(filters.pizzaDayId) : Promise.resolve([]),
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
        timeSlots={timeSlots}
      />
    </div>
  )
}
