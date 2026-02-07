import type { OrderStatus } from '@/types'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  nova: 'Nová',
  potvrdena: 'Potvrdená',
  pripravuje_sa: 'Pripravuje sa',
  hotova: 'Hotová',
  vydana: 'Vydaná',
  zrusena: 'Zrušená',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  nova: 'bg-blue-100 text-blue-800',
  potvrdena: 'bg-yellow-100 text-yellow-800',
  pripravuje_sa: 'bg-orange-100 text-orange-800',
  hotova: 'bg-green-100 text-green-800',
  vydana: 'bg-gray-100 text-gray-800',
  zrusena: 'bg-red-100 text-red-800',
}

export const ORDER_STATUSES: OrderStatus[] = [
  'nova',
  'potvrdena',
  'pripravuje_sa',
  'hotova',
  'vydana',
  'zrusena',
]

export const PIZZA_CATEGORY_NAME = 'Pizzy'
export const PRILOHA_CATEGORY_NAME = 'Príloha'
export const MAX_TOPPINGS_PER_PIZZA = 3

export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
