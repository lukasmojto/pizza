'use client'

import { useRealtimeOrder } from '@/hooks/use-realtime-order'
import { formatPrice, formatDateSk, formatTime } from '@/lib/utils'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants'
import { CheckCircle, Clock, Phone, User, Mail, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Order, OrderItem, TimeSlot, PizzaDay, OrderStatus } from '@/types'
import Link from 'next/link'
import { Button } from '@/components/ui'

interface OrderWithDetails extends Order {
  order_items: OrderItem[]
  time_slots: TimeSlot
  pizza_days: PizzaDay
}

interface Props {
  initialOrder: OrderWithDetails
}

export function OrderConfirmationClient({ initialOrder }: Props) {
  const order = useRealtimeOrder(initialOrder.id, initialOrder)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Objednávka prijatá!</h1>
        <p className="mt-2 text-gray-500">
          Ďakujeme za vašu objednávku. Sledujte jej stav nižšie.
        </p>
      </div>

      {/* Status */}
      <div className="mb-6 rounded-xl border bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-500">Stav objednávky</p>
        <span
          className={cn(
            'mt-2 inline-flex items-center rounded-full px-4 py-2 text-lg font-semibold',
            ORDER_STATUS_COLORS[order.status as OrderStatus]
          )}
        >
          {ORDER_STATUS_LABELS[order.status as OrderStatus]}
        </span>
        <p className="mt-2 text-xs text-gray-400">
          Stav sa aktualizuje automaticky v reálnom čase
        </p>
      </div>

      {/* Order details */}
      <div className="space-y-4">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Detaily objednávky</h2>

          <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="h-4 w-4" />
              <span>
                {formatDateSk(initialOrder.pizza_days.date)}
                <br />
                {formatTime(initialOrder.time_slots.time_from)} - {formatTime(initialOrder.time_slots.time_to)}
              </span>
            </div>
            <div className="space-y-1 text-gray-500">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{order.customer_phone}</span>
              </div>
              {order.customer_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{order.customer_email}</span>
                </div>
              )}
            </div>
          </div>

          {order.customer_note && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
              {order.customer_note}
            </div>
          )}

          <div className="space-y-2 border-t pt-4">
            {initialOrder.order_items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}x {item.item_name}
                </span>
                <span className="font-medium">
                  {formatPrice(item.item_price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Celkom</span>
              <span className="text-red-600">{formatPrice(Number(order.total_price))}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/domov">
          <Button variant="outline">Späť na hlavnú stránku</Button>
        </Link>
      </div>
    </div>
  )
}
