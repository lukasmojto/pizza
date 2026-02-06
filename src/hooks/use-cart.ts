import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartState } from '@/types'

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      pizzaDayId: null,
      timeSlotId: null,

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.menuItemId === item.menuItemId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.menuItemId === item.menuItemId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        })
      },

      removeItem: (menuItemId) => {
        set((state) => {
          const existing = state.items.find((i) => i.menuItemId === menuItemId)
          if (existing && existing.quantity > 1) {
            return {
              items: state.items.map((i) =>
                i.menuItemId === menuItemId
                  ? { ...i, quantity: i.quantity - 1 }
                  : i
              ),
            }
          }
          return { items: state.items.filter((i) => i.menuItemId !== menuItemId) }
        })
      },

      updateQuantity: (menuItemId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.menuItemId !== menuItemId) }
          }
          return {
            items: state.items.map((i) =>
              i.menuItemId === menuItemId ? { ...i, quantity } : i
            ),
          }
        })
      },

      setTimeSlot: (pizzaDayId, timeSlotId) => {
        set({ pizzaDayId, timeSlotId })
      },

      clearCart: () => {
        set({ items: [], pizzaDayId: null, timeSlotId: null })
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      getPizzaCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'pizza-cart',
    }
  )
)
