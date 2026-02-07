'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { updateOrderStatus, deleteOrder } from '@/actions/orders'
import {
  Button, Select, Input, Card, CardContent,
  Dialog, DialogHeader, DialogContent, DialogFooter,
} from '@/components/ui'
import { useToast } from '@/components/ui/toast'
import { cn, formatPrice, formatDateShort, formatTime } from '@/lib/utils'
import {
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUSES,
  PRILOHA_CATEGORY_NAME, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS,
} from '@/lib/constants'
import { Search, Eye, ShoppingCart, DollarSign, Pizza, ChevronUp, ChevronDown, X } from 'lucide-react'
import type { Order, OrderItem, TimeSlot, PizzaDay, OrderStatus } from '@/types'

interface OrderItemWithCategory extends OrderItem {
  menu_items: { categories: { name: string } | null } | null
}

interface OrderWithDetails extends Order {
  order_items: OrderItemWithCategory[]
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

type SortKey = 'customer_name' | 'day_slot' | 'items_count' | 'pizza_count' | 'total_price' | 'status'
type SortDir = 'asc' | 'desc'

interface Props {
  initialOrders: OrderWithDetails[]
  pizzaDays: PizzaDayWithSlots[]
  stats: Stats | null
  currentFilters: { pizzaDayId?: string; status?: string; search?: string; timeSlotId?: string }
  timeSlots: TimeSlot[]
}

function compareOrders(a: OrderWithDetails, b: OrderWithDetails, key: SortKey, dir: SortDir): number {
  let cmp = 0
  switch (key) {
    case 'customer_name':
      cmp = a.customer_name.localeCompare(b.customer_name, 'sk')
      break
    case 'day_slot': {
      const dateA = a.pizza_days.date + 'T' + a.time_slots.time_from
      const dateB = b.pizza_days.date + 'T' + b.time_slots.time_from
      cmp = dateA.localeCompare(dateB)
      break
    }
    case 'items_count':
      cmp = a.order_items.length - b.order_items.length
      break
    case 'pizza_count':
      cmp = a.pizza_count - b.pizza_count
      break
    case 'total_price':
      cmp = Number(a.total_price) - Number(b.total_price)
      break
    case 'status':
      cmp = a.status.localeCompare(b.status, 'sk')
      break
  }
  return dir === 'asc' ? cmp : -cmp
}

const SORTABLE_COLUMNS: { label: string; key: SortKey }[] = [
  { label: 'Zákazník', key: 'customer_name' },
  { label: 'Deň / Okno', key: 'day_slot' },
  { label: 'Položky', key: 'items_count' },
  { label: 'Počet pizz', key: 'pizza_count' },
  { label: 'Suma', key: 'total_price' },
  { label: 'Stav', key: 'status' },
]

export function OrdersClient({ initialOrders, pizzaDays, stats, currentFilters, timeSlots }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)

  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset timeSlotId when pizzaDayId changes
    if (key === 'pizzaDayId') {
      params.delete('timeSlotId')
    }
    router.push(`/admin/objednavky?${params.toString()}`)
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setCurrentPage(1)
  }

  // Sort data
  const sortedOrders = useMemo(() => {
    if (!sortKey) return initialOrders
    return [...initialOrders].sort((a, b) => compareOrders(a, b, sortKey, sortDir))
  }, [initialOrders, sortKey, sortDir])

  // Paginate
  const totalItems = sortedOrders.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const start = (safePage - 1) * pageSize
  const paginatedOrders = sortedOrders.slice(start, start + pageSize)

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize)
    setCurrentPage(1)
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

  function renderSortIcon(key: SortKey) {
    if (sortKey !== key) return null
    return sortDir === 'asc'
      ? <ChevronUp className="ml-1 inline h-4 w-4" />
      : <ChevronDown className="ml-1 inline h-4 w-4" />
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
        {currentFilters.pizzaDayId && (
          <Select
            value={currentFilters.timeSlotId ?? ''}
            onChange={(e) => updateFilter('timeSlotId', e.target.value)}
            className="w-52"
          >
            <option value="">Všetky okná</option>
            {timeSlots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {formatTime(slot.time_from)} - {formatTime(slot.time_to)}
              </option>
            ))}
          </Select>
        )}
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
        {(currentFilters.pizzaDayId || currentFilters.status || currentFilters.search || currentFilters.timeSlotId) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/objednavky')}
            className="gap-1 text-gray-500"
          >
            <X className="h-4 w-4" />
            Reset filtrov
          </Button>
        )}
      </div>

      {/* Orders table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-500">
                {SORTABLE_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="cursor-pointer select-none px-4 py-3 hover:text-gray-700"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    {renderSortIcon(col.key)}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Akcie</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedOrders.map((order) => (
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
              {paginatedOrders.length === 0 && (
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

      {/* Pagination bar */}
      {totalItems > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Zobrazených {start + 1}–{Math.min(start + pageSize, totalItems)} z {totalItems}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Predchádzajúca
            </Button>
            <span className="text-sm text-gray-700">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Nasledujúca
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="w-20"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
            <span className="text-sm text-gray-500">na stránku</span>
          </div>
        </div>
      )}

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
                  {selectedOrder.order_items.map((item) => {
                    const isTopping = item.menu_items?.categories?.name === PRILOHA_CATEGORY_NAME
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'flex justify-between text-sm',
                          isTopping && 'ml-4 text-xs'
                        )}
                      >
                        <span className={isTopping ? 'text-gray-400' : undefined}>
                          {isTopping ? '+ ' : `${item.quantity}x `}{item.item_name}
                        </span>
                        <span className={isTopping ? 'text-gray-400' : 'font-medium'}>
                          {formatPrice(item.item_price * item.quantity)}
                        </span>
                      </div>
                    )
                  })}
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
