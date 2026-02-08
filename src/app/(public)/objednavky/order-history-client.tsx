'use client'

import Link from 'next/link'
import { ClipboardList, Package } from 'lucide-react'
import { Card, CardContent, Badge } from '@/components/ui'
import { formatPrice, formatDateShort, formatTime } from '@/lib/utils'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants'
import type { OrderStatus } from '@/types'

type OrderWithDetails = {
  id: string
  status: string
  total_price: number
  pizza_count: number
  created_at: string
  customer_name: string
  customer_note: string | null
  order_items: {
    id: string
    item_name: string
    item_price: number
    quantity: number
  }[]
  time_slots: {
    time_from: string
    time_to: string
  } | null
  pizza_days: {
    date: string
  } | null
}

interface OrderHistoryClientProps {
  orders: OrderWithDetails[]
}

const ACTIVE_STATUSES = ['nova', 'potvrdena', 'pripravuje_sa', 'hotova']
const DONE_STATUSES = ['vydana', 'zrusena']

export function OrderHistoryClient({ orders }: OrderHistoryClientProps) {
  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status))
  const doneOrders = orders.filter((o) => DONE_STATUSES.includes(o.status))

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Moje objednávky</h1>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center">
          <Package className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Žiadne objednávky</h2>
          <p className="mt-2 text-gray-500">Zatiaľ ste nevytvorili žiadnu objednávku</p>
          <Link
            href="/domov"
            className="mt-4 inline-block text-sm font-medium text-red-600 hover:text-red-700"
          >
            Prejsť na pizza dni
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {activeOrders.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Aktívne objednávky</h2>
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          )}

          {doneOrders.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Dokončené objednávky</h2>
              <div className="space-y-4">
                {doneOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function OrderCard({ order }: { order: OrderWithDetails }) {
  const status = order.status as OrderStatus
  const statusLabel = ORDER_STATUS_LABELS[status] || order.status
  const statusColor = ORDER_STATUS_COLORS[status] || ''

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            {order.pizza_days && (
              <p className="text-sm font-medium text-gray-900">
                {formatDateShort(order.pizza_days.date)}
              </p>
            )}
            {order.time_slots && (
              <p className="text-xs text-gray-500">
                {formatTime(order.time_slots.time_from)} - {formatTime(order.time_slots.time_to)}
              </p>
            )}
          </div>
          <Badge className={statusColor}>{statusLabel}</Badge>
        </div>

        <div className="mt-3 space-y-1">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.quantity}x {item.item_name}
              </span>
              <span className="text-gray-500">{formatPrice(item.item_price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <Link
            href={`/potvrdenie/${order.id}`}
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            Detail objednávky
          </Link>
          <p className="text-lg font-bold text-gray-900">{formatPrice(order.total_price)}</p>
        </div>
      </CardContent>
    </Card>
  )
}
