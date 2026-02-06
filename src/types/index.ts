export type {
  Database,
  Json,
  OrderStatus,
  Category,
  MenuItem,
  PizzaDay,
  TimeSlot,
  Order,
  OrderItem,
  AdminProfile
} from './database'

export interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  categoryName: string
}

export interface CartState {
  items: CartItem[]
  pizzaDayId: string | null
  timeSlotId: string | null
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  setTimeSlot: (pizzaDayId: string, timeSlotId: string) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
  getPizzaCount: () => number
}

export interface PlaceOrderInput {
  timeSlotId: string
  pizzaDayId: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  customerNote?: string
  items: {
    menuItemId: string
    itemName: string
    itemPrice: number
    quantity: number
  }[]
  pizzaCount: number
}
