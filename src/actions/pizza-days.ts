'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { pizzaDaySchema } from '@/lib/validators'

export async function getPizzaDays() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pizza_days')
    .select('*, time_slots(count)')
    .order('date', { ascending: false })

  if (error) throw error
  return data
}

export async function getPizzaDay(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pizza_days')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getUpcomingPizzaDays() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('pizza_days')
    .select('*, time_slots(*)')
    .eq('active', true)
    .gte('date', today)
    .order('date', { ascending: true })

  if (error) throw error
  return data
}

export async function createPizzaDay(_prevState: unknown, formData: FormData) {
  const raw = {
    date: formData.get('date') as string,
    active: formData.get('active') === 'on',
    note: (formData.get('note') as string) || null,
  }

  const parsed = pizzaDaySchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('pizza_days').insert(parsed.data)

  if (error) {
    if (error.code === '23505') return { error: 'Pizza deň na tento dátum už existuje' }
    return { error: 'Nepodarilo sa vytvoriť pizza deň' }
  }

  revalidatePath('/admin/pizza-dni')
  return { success: true }
}

export async function updatePizzaDay(_prevState: unknown, formData: FormData) {
  const id = formData.get('id') as string
  const raw = {
    date: formData.get('date') as string,
    active: formData.get('active') === 'on',
    note: (formData.get('note') as string) || null,
  }

  const parsed = pizzaDaySchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('pizza_days').update(parsed.data).eq('id', id)

  if (error) return { error: 'Nepodarilo sa aktualizovať pizza deň' }

  revalidatePath('/admin/pizza-dni')
  return { success: true }
}

export async function deletePizzaDay(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('pizza_days').delete().eq('id', id)

  if (error) return { error: 'Nepodarilo sa vymazať pizza deň' }

  revalidatePath('/admin/pizza-dni')
  return { success: true }
}
