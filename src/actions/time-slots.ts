'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { timeSlotSchema } from '@/lib/validators'

export async function getTimeSlots(pizzaDayId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('time_slots')
    .select('*')
    .eq('pizza_day_id', pizzaDayId)
    .order('time_from', { ascending: true })

  if (error) throw error
  return data
}

export async function createTimeSlot(_prevState: unknown, formData: FormData) {
  const raw = {
    pizza_day_id: formData.get('pizza_day_id') as string,
    time_from: formData.get('time_from') as string,
    time_to: formData.get('time_to') as string,
    max_pizzas: formData.get('max_pizzas') as string,
    is_open: formData.get('is_open') === 'on',
  }

  const parsed = timeSlotSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('time_slots').insert(parsed.data)

  if (error) return { error: 'Nepodarilo sa vytvoriť časové okno' }

  revalidatePath('/admin/pizza-dni')
  return { success: true }
}

export async function updateTimeSlot(_prevState: unknown, formData: FormData) {
  const id = formData.get('id') as string
  const raw = {
    pizza_day_id: formData.get('pizza_day_id') as string,
    time_from: formData.get('time_from') as string,
    time_to: formData.get('time_to') as string,
    max_pizzas: formData.get('max_pizzas') as string,
    is_open: formData.get('is_open') === 'on',
  }

  const parsed = timeSlotSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('time_slots').update(parsed.data).eq('id', id)

  if (error) return { error: 'Nepodarilo sa aktualizovať časové okno' }

  revalidatePath('/admin/pizza-dni')
  return { success: true }
}

export async function deleteTimeSlot(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('time_slots').delete().eq('id', id)

  if (error) return { error: 'Nepodarilo sa vymazať časové okno' }

  revalidatePath('/admin/pizza-dni')
  return { success: true }
}
