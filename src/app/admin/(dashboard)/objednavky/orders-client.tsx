'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { updateOrderStatus, deleteOrder } from '@/actions/orders'
import {
  Button, Select, Input, Card, CardContent,
  Dialog, DialogHeader, DialogContent, DialogFooter,
} from '@/components/ui'
import { useToast } from '@/components/ui/toast'
import { cn, formatPrice, formatDateShort, formatTime } from '@/lib/utils'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUSES } from '@/lib/constants'
import { Search, Eye, ShoppingCart, DollarSign, Pizza } from 'lucide-react'
import type { Order, OrderItem, TimeSlot, PizzaDay, OrderStatus } from '@/types'

interface OrderWithDetails extends Order {
  order_items: OrderItem[]
  time_slots: TimeSlot
  pizza_days: PizzaDay
}

interface PizzaDayWithSlots extends PizzaDay {
  time_slots: { count: number }[]
}

interface Stats {
  total: number
  nova: number
  potvrdena: number
  pripravuje_sa: number
  hotova: number
  vydana: number
  zrusena: number
  totalRevenue: number
  totalPizzas: number
}

interface Props {
  initialOrders: OrderWithDetails[]
  pizzaDays: PizzaDayWithSlots[]
  stats: Stats | null
  currentFilters: { pizzaDayId?: string; status?: string; search?: string }
}

export function OrdersClient({ initialOrders, pizzaDays, stats, currentFilters }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/objednavky?${params.toString()}`)
  }

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    const result = await updateOrderStatus(orderId, status)
    if (result.error) {
      toast(result.error, 'error')
    } else {
      toast('Stav objednávky zmenený', 'success')
      setSelectedOrder(null)
    }
  }

  async function handleDelete(orderId: string) {
    if (!confirm('Naozaj chcete VYMAZAŤ túto objednávku? Táto akcia je nevratná.')) return
    const result = await deleteOrder(orderId)
    if (result.error) {
      toast(result.error, 'error')
    } else {
      toast('Objednávka vymazaná', 'success')
      setSelectedOrder(null)
    }
  }

  return (
    <>
      {/* Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-500">Objednávok</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                <Pizza className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.nova + stats.potvrdena + stats.pripravuje_sa}</p>
                <p className="text-xs text-gray-500">Aktívnych</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
                <p className="text-xs text-gray-500">Tržby</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <Pizza className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPizzas}</p>
                <p className="text-xs text-gray-500">Pizz celkom</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          value={currentFilters.pizzaDayId ?? ''}
          onChange={(e) => updateFilter('pizzaDayId', e.target.value)}
          className="w-48"
        >
          <option value="">Všetky dni</option>
          {pizzaDays.map((d) => (
            <option key={d.id} value={d.id}>{formatDateShort(d.date)}</option>
          ))}
        </Select>
        <Select
          value={currentFilters.status ?? ''}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="w-40"
        >
          <option value="">Všetky stavy</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Hľadať meno, telefón..."
            defaultValue={currentFilters.search ?? ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateFilter('search', (e.target as HTMLInputElement).value)
              }
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Orders table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-500">
                <th className="px-4 py-3">Zákazník</th>
                <th className="px-4 py-3">Deň / Okno</th>
                <th className="px-4 py-3">Položky</th>
                <th className="px-4 py-3">Počet pizz</th>
                <th className="px-4 py-3">Suma</th>
                <th className="px-4 py-3">Stav</th>
                <th className="px-4 py-3 text-right">Akcie</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{order.customer_name}</p>
                    <p className="text-sm text-gray-500">{order.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDateShort(order.pizza_days.date)}
                    <br />
                    {formatTime(order.time_slots.time_from)} - {formatTime(order.time_slots.time_to)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {order.order_items.length} položiek
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {order.pizza_count}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatPrice(Number(order.total_price))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', ORDER_STATUS_COLORS[order.status as OrderStatus])}>
                      {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {initialOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Žiadne objednávky
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Order detail dialog */}
      <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} className="max-w-2xl">
        <DialogHeader onClose={() => setSelectedOrder(null)}>
          Detail objednávky
        </DialogHeader>
        {selectedOrder && (
          <>
            <DialogContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Zákazník</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.customer_phone}</p>
                  {selectedOrder.customer_email && (
                    <p className="text-sm text-gray-500">{selectedOrder.customer_email}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Časové okno</p>
                  <p className="font-medium">{formatDateShort(selectedOrder.pizza_days.date)}</p>
                  <p className="text-sm text-gray-500">
                    {formatTime(selectedOrder.time_slots.time_from)} - {formatTime(selectedOrder.time_slots.time_to)}
                  </p>
                </div>
              </div>

              {selectedOrder.customer_note && (
                <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                  <strong>Poznámka:</strong> {selectedOrder.customer_note}
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-medium text-gray-500">Položky</p>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.item_name}</span>
                      <span className="font-medium">{formatPrice(item.item_price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>Celkom</span>
                    <span className="text-red-600">{formatPrice(Number(selectedOrder.total_price))}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-500">Zmeniť stav</p>
                <div className="flex flex-wrap gap-2">
                  {ORDER_STATUSES.map((status) => (
                    <Button
                      key={status}
                      variant={selectedOrder.status === status ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(selectedOrder.id, status)}
                      disabled={selectedOrder.status === status}
                    >
                      {ORDER_STATUS_LABELS[status]}
                    </Button>
                  ))}
                </div>
              </div>
            </DialogContent>
            <DialogFooter className="justify-between">
              <Button variant="danger" onClick={() => handleDelete(selectedOrder.id)}>
                Vymazať objednávku
              </Button>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Zavrieť
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </>
  )
}
