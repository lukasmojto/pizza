'use client'

import { useState } from 'react'
import { useRealtimeSlots } from '@/hooks/use-realtime-slots'
import { useCart } from '@/hooks/use-cart'
import { formatPrice, formatTime, isSlotAvailable, getSlotCapacityPercent } from '@/lib/utils'
import { PRILOHA_CATEGORY_NAME, MAX_TOPPINGS_PER_PIZZA } from '@/lib/constants'
import { Clock, ShoppingCart, Plus, Minus, Check } from 'lucide-react'
import { Button } from '@/components/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { TimeSlot, MenuItem, Category, CartTopping } from '@/types'

interface CategoryWithItems extends Category {
  menu_items: MenuItem[]
}

interface Props {
  pizzaDayId: string
  initialSlots: TimeSlot[]
  categories: CategoryWithItems[]
}

function ToppingPicker({ pizzaMenuItemId, toppingItems }: { pizzaMenuItemId: string; toppingItems: MenuItem[] }) {
  const { items, addTopping, removeTopping } = useCart()
  const cartItem = items.find((i) => i.menuItemId === pizzaMenuItemId)
  const currentToppings = cartItem?.toppings ?? []
  const isMaxReached = currentToppings.length >= MAX_TOPPINGS_PER_PIZZA

  if (toppingItems.length === 0) return null

  return (
    <div className="mt-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Prílohy ({currentToppings.length}/{MAX_TOPPINGS_PER_PIZZA})
      </p>
      <div className="space-y-1">
        {toppingItems.map((topping) => {
          const isSelected = currentToppings.some((t) => t.menuItemId === topping.id)
          const isDisabled = !isSelected && isMaxReached

          return (
            <button
              key={topping.id}
              disabled={isDisabled}
              onClick={() => {
                if (isSelected) {
                  removeTopping(pizzaMenuItemId, topping.id)
                } else {
                  addTopping(pizzaMenuItemId, {
                    menuItemId: topping.id,
                    name: topping.name,
                    price: topping.price,
                  })
                }
              }}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
                isSelected
                  ? 'bg-red-50 text-red-700'
                  : isDisabled
                    ? 'cursor-not-allowed text-gray-300'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                {isSelected ? (
                  <Check className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {topping.name}
              </span>
              <span className="text-xs font-medium">+{formatPrice(topping.price)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MenuItemCard({ item, categoryName, toppingItems }: { item: MenuItem; categoryName: string; toppingItems?: MenuItem[] }) {
  const { items, addItem, removeItem } = useCart()
  const cartItem = items.find((i) => i.menuItemId === item.id)
  const quantity = cartItem?.quantity ?? 0

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex gap-4">
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
      {toppingItems && quantity > 0 && (
        <ToppingPicker pizzaMenuItemId={item.id} toppingItems={toppingItems} />
      )}
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
  const router = useRouter()
  const { items, timeSlotId, getTotalPrice, getTotalItems, getPizzaCount } = useCart()
  const [capacityError, setCapacityError] = useState<string | null>(null)
  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  const toppingCategory = categories.find((c) => c.name === PRILOHA_CATEGORY_NAME)
  const toppingItems = toppingCategory?.menu_items ?? []
  const displayCategories = categories.filter((c) => c.name !== PRILOHA_CATEGORY_NAME)

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Menu - left 2 columns */}
      <div className="space-y-8 lg:col-span-2">
        {displayCategories.map((category) => (
          <div key={category.id}>
            <h2 className="mb-4 text-xl font-bold text-gray-900">{category.name}</h2>
            <div className="space-y-3">
              {category.menu_items.map((item: MenuItem) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  categoryName={category.name}
                  toppingItems={toppingItems.length > 0 ? toppingItems : undefined}
                />
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
                  <div key={item.menuItemId}>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                    {item.toppings && item.toppings.length > 0 && (
                      <div className="ml-4 mt-0.5 space-y-0.5">
                        {item.toppings.map((t) => (
                          <div key={t.menuItemId} className="flex justify-between text-xs text-gray-400">
                            <span>+ {t.name}</span>
                            <span>{formatPrice(t.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Spolu</span>
                    <span className="text-red-600">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>
              {capacityError && (
                <p className="mt-3 text-sm text-red-600">{capacityError}</p>
              )}
              <Button
                className="mt-4 w-full"
                size="lg"
                onClick={() => {
                  setCapacityError(null)
                  if (!timeSlotId) {
                    setCapacityError('Vyberte najprv časové okno.')
                    return
                  }
                  const selectedSlot = slots.find((s) => s.id === timeSlotId)
                  if (!selectedSlot) {
                    setCapacityError('Vybrané časové okno už nie je dostupné.')
                    return
                  }
                  const pizzaCount = getPizzaCount()
                  const remaining = selectedSlot.max_pizzas - selectedSlot.current_pizza_count
                  if (pizzaCount > remaining) {
                    setCapacityError(
                      `Vo vybranom okne zostáva len ${remaining} voľných miest, ale máte ${pizzaCount} pizz v košíku.`
                    )
                    return
                  }
                  router.push('/objednavka')
                }}
              >
                Pokračovať k objednávke
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
