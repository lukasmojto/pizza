import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartState } from '@/types'
import { PRILOHA_CATEGORY_NAME, MAX_TOPPINGS_PER_PIZZA } from '@/lib/constants'

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      pizzaDayId: null,
      timeSlotId: null,

      addItem: (item) => {
        set((state) => ({
          items: [
            ...state.items,
            { ...item, cartItemId: crypto.randomUUID(), quantity: 1 },
          ],
        }))
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.cartItemId !== cartItemId),
        }))
      },

      removeLastItem: (menuItemId) => {
        set((state) => {
          const lastIndex = state.items.findLastIndex(
            (i) => i.menuItemId === menuItemId
          )
          if (lastIndex === -1) return state
          return {
            items: state.items.filter((_, idx) => idx !== lastIndex),
          }
        })
      },

      addTopping: (cartItemId, topping) => {
        set((state) => ({
          items: state.items.map((i) => {
            if (i.cartItemId !== cartItemId) return i
            const current = i.toppings ?? []
            if (current.length >= MAX_TOPPINGS_PER_PIZZA) return i
            if (current.some((t) => t.menuItemId === topping.menuItemId)) return i
            return { ...i, toppings: [...current, topping] }
          }),
        }))
      },

      removeTopping: (cartItemId, toppingMenuItemId) => {
        set((state) => ({
          items: state.items.map((i) => {
            if (i.cartItemId !== cartItemId) return i
            return {
              ...i,
              toppings: (i.toppings ?? []).filter((t) => t.menuItemId !== toppingMenuItemId),
            }
          }),
        }))
      },

      setTimeSlot: (pizzaDayId, timeSlotId) => {
        set({ pizzaDayId, timeSlotId })
      },

      clearCart: () => {
        set({ items: [], pizzaDayId: null, timeSlotId: null })
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => {
          const toppingsPrice = (item.toppings ?? []).reduce((ts, t) => ts + t.price, 0)
          return sum + item.price + toppingsPrice
        }, 0)
      },

      getTotalItems: () => {
        return get().items.length
      },

      getPizzaCount: () => {
        return get().items.filter((item) => item.categoryName !== PRILOHA_CATEGORY_NAME).length
      },
    }),
    {
      name: 'pizza-cart',
      version: 2,
      migrate: () => ({ items: [], pizzaDayId: null, timeSlotId: null }),
    }
  )
)
