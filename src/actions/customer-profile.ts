'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { customerProfileSchema } from '@/lib/validators'
import type { CustomerProfile } from '@/types'

export async function getCustomerProfile(): Promise<CustomerProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If logged in but no profile row exists, create one (e.g. OAuth user or pre-migration user)
  if (!data) {
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null
    const phone = user.user_metadata?.phone || null
    const { data: newProfile } = await supabase
      .from('customer_profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        full_name: fullName,
        phone,
      })
      .select()
      .single()

    return newProfile
  }

  return data
}

export type ProfileState = {
  error?: string
  success?: string
  fieldErrors?: Record<string, string>
} | null

export async function updateCustomerProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Nie ste prihlásený' }
  }

  const raw = {
    fullName: formData.get('fullName') as string,
    phone: formData.get('phone') as string,
    address: formData.get('address') as string,
  }

  const parsed = customerProfileSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((err) => {
      const key = err.path[0]
      if (key != null) fieldErrors[String(key)] = err.message
    })
    return { fieldErrors }
  }

  const { error } = await supabase
    .from('customer_profiles')
    .update({
      full_name: parsed.data.fullName || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
    })
    .eq('id', user.id)

  if (error) {
    return { error: 'Nepodarilo sa aktualizovať profil' }
  }

  revalidatePath('/profil')
  return { success: 'Profil bol aktualizovaný' }
}

export async function getCustomerOrders() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, menu_items(categories(name))), time_slots(*), pizza_days(*)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}
