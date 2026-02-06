'use client'

import { useRealtimeSlots } from '@/hooks/use-realtime-slots'
import { useCart } from '@/hooks/use-cart'
import { formatPrice, formatTime, isSlotAvailable, getSlotCapacityPercent } from '@/lib/utils'
import { Clock, ShoppingCart, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui'
import Link from 'next/link'
import Image from 'next/image'
import type { TimeSlot, MenuItem, Category } from '@/types'

interface CategoryWithItems extends Category {
  menu_items: MenuItem[]
}

interface Props {
  pizzaDayId: string
  initialSlots: TimeSlot[]
  categories: CategoryWithItems[]
}

function MenuItemCard({ item, categoryName }: { item: MenuItem; categoryName: string }) {
  const { items, addItem, removeItem } = useCart()
  const cartItem = items.find((i) => i.menuItemId === item.id)
  const quantity = cartItem?.quantity ?? 0

  return (
    <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {item.image_url && (
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{item.name}</h3>
            {item.description && (
              <p className="mt-0.5 text-sm text-gray-500">{item.description}</p>
            )}
            {item.weight_grams && (
              <p className="text-xs text-gray-400">{item.weight_grams}g</p>
            )}
          </div>
          <p className="ml-4 text-lg font-bold text-red-600">{formatPrice(item.price)}</p>
        </div>
        <div className="mt-auto flex items-center justify-end pt-2">
          {quantity === 0 ? (
            <Button
              size="sm"
              onClick={() =>
                addItem({
                  menuItemId: item.id,
                  name: item.name,
                  price: item.price,
                  categoryName,
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Pridať
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeItem(item.id)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  addItem({
                    menuItemId: item.id,
                    name: item.name,
                    price: item.price,
                    categoryName,
                  })
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TimeSlotPicker({
  slots,
  pizzaDayId,
}: {
  slots: TimeSlot[]
  pizzaDayId: string
}) {
  const { timeSlotId, setTimeSlot } = useCart()

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-900">
        <Clock className="mr-2 inline h-5 w-5" />
        Vyberte časové okno
      </h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {slots.map((slot) => {
          const available = isSlotAvailable(slot)
          const percent = getSlotCapacityPercent(slot)
          const isSelected = timeSlotId === slot.id

          return (
            <button
              key={slot.id}
              disabled={!available}
              onClick={() => setTimeSlot(pizzaDayId, slot.id)}
              className={`rounded-lg border-2 p-3 text-left transition-all ${
                isSelected
                  ? 'border-red-500 bg-red-50'
                  : available
                    ? 'border-gray-200 bg-white hover:border-red-200'
                    : 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-50'
              }`}
            >
              <p className="font-medium">
                {formatTime(slot.time_from)} - {formatTime(slot.time_to)}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full ${percent >= 90 ? 'bg-red-500' : percent >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {available
                    ? `${slot.max_pizzas - slot.current_pizza_count} voľných`
                    : 'Plné'}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function PizzaDayClient({ pizzaDayId, initialSlots, categories }: Props) {
  const slots = useRealtimeSlots(pizzaDayId, initialSlots)
  const { items, getTotalPrice, getTotalItems } = useCart()
  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Menu - left 2 columns */}
      <div className="space-y-8 lg:col-span-2">
        {categories.map((category) => (
          <div key={category.id}>
            <h2 className="mb-4 text-xl font-bold text-gray-900">{category.name}</h2>
            <div className="space-y-3">
              {category.menu_items.map((item: MenuItem) => (
                <MenuItemCard key={item.id} item={item} categoryName={category.name} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar - time slots + cart summary */}
      <div className="space-y-6">
        <div className="sticky top-20">
          <TimeSlotPicker slots={slots} pizzaDayId={pizzaDayId} />

          {/* Cart summary */}
          {totalItems > 0 && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <ShoppingCart className="h-5 w-5" />
                Košík ({totalItems})
              </h3>
              <div className="mt-3 space-y-2">
                {items.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Spolu</span>
                    <span className="text-red-600">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>
              <Link href="/objednavka">
                <Button className="mt-4 w-full" size="lg">
                  Pokračovať k objednávke
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
