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
  AdminProfile,
  CustomerProfile
} from './database'

export interface CartTopping {
  menuItemId: string
  name: string
  price: number
}

export interface CartItem {
  cartItemId: string
  menuItemId: string
  name: string
  price: number
  quantity: number
  categoryName: string
  toppings?: CartTopping[]
}

export interface CartState {
  items: CartItem[]
  pizzaDayId: string | null
  timeSlotId: string | null
  addItem: (item: Omit<CartItem, 'quantity' | 'cartItemId' | 'toppings'>) => void
  removeItem: (cartItemId: string) => void
  removeLastItem: (menuItemId: string) => void
  setTimeSlot: (pizzaDayId: string, timeSlotId: string) => void
  addTopping: (cartItemId: string, topping: CartTopping) => void
  removeTopping: (cartItemId: string, toppingMenuItemId: string) => void
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
  customerAddress?: string
  customerNote?: string
  items: {
    menuItemId: string
    itemName: string
    itemPrice: number
    quantity: number
  }[]
  pizzaCount: number
  customerId?: string
}
