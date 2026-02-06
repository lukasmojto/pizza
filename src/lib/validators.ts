import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(1, 'Názov je povinný').max(100, 'Názov je príliš dlhý'),
  sort_order: z.coerce.number().int().min(0).default(0),
})

export const menuItemSchema = z.object({
  category_id: z.string().uuid('Vyberte kategóriu'),
  name: z.string().min(1, 'Názov je povinný').max(200, 'Názov je príliš dlhý'),
  description: z.string().max(500).nullable().optional(),
  price: z.coerce.number().positive('Cena musí byť kladná'),
  weight_grams: z.coerce.number().int().positive().nullable().optional(),
  active: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0),
})

export const pizzaDaySchema = z.object({
  date: z.string().min(1, 'Dátum je povinný'),
  active: z.boolean().default(true),
  note: z.string().max(500).nullable().optional(),
})

export const timeSlotSchema = z.object({
  pizza_day_id: z.string().uuid(),
  time_from: z.string().min(1, 'Čas od je povinný'),
  time_to: z.string().min(1, 'Čas do je povinný'),
  max_pizzas: z.coerce.number().int().positive('Kapacita musí byť kladná'),
  is_open: z.boolean().default(true),
})

export const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Meno musí mať aspoň 2 znaky').max(100),
  customerPhone: z
    .string()
    .min(1, 'Telefón je povinný')
    .regex(/^(\+421|0)[0-9\s]{8,12}$/, 'Neplatný formát telefónneho čísla'),
  customerEmail: z
    .string()
    .email('Neplatný email')
    .optional()
    .or(z.literal('')),
  customerNote: z.string().max(500).optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Neplatný email'),
  password: z.string().min(6, 'Heslo musí mať aspoň 6 znakov'),
})

export type CategoryInput = z.infer<typeof categorySchema>
export type MenuItemInput = z.infer<typeof menuItemSchema>
export type PizzaDayInput = z.infer<typeof pizzaDaySchema>
export type TimeSlotInput = z.infer<typeof timeSlotSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
export type LoginInput = z.infer<typeof loginSchema>
