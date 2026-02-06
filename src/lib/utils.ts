import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { sk } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

export function formatDateSk(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'd. MMMM yyyy (EEEE)', { locale: sk })
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'd.M.yyyy', { locale: sk })
}

export function formatTime(time: string): string {
  return time.slice(0, 5)
}

export function isSlotAvailable(slot: { is_open: boolean; current_pizza_count: number; max_pizzas: number }): boolean {
  return slot.is_open && slot.current_pizza_count < slot.max_pizzas
}

export function getSlotCapacityPercent(slot: { current_pizza_count: number; max_pizzas: number }): number {
  if (slot.max_pizzas === 0) return 100
  return Math.round((slot.current_pizza_count / slot.max_pizzas) * 100)
}
