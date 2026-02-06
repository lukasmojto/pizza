'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { OrderStatus } from '@/types'

export async function placeOrder(input: {
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
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('place_order', {
    p_time_slot_id: input.timeSlotId,
    p_pizza_day_id: input.pizzaDayId,
    p_customer_name: input.customerName,
    p_customer_phone: input.customerPhone,
    p_customer_email: input.customerEmail || undefined,
    p_customer_note: input.customerNote || undefined,
    p_items: JSON.parse(JSON.stringify(input.items)),
    p_pizza_count: input.pizzaCount,
  })

  if (error) {
    return { success: false, error: 'Nepodarilo sa vytvoriť objednávku' }
  }

  const result = data as { success: boolean; error?: string; order_id?: string }

  if (!result.success) {
    return { success: false, error: result.error || 'Nepodarilo sa vytvoriť objednávku' }
  }

  return { success: true, orderId: result.order_id }
}

export async function getOrder(orderId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), time_slots(*), pizza_days(*)')
    .eq('id', orderId)
    .single()

  if (error) return null
  return data
}

export async function getOrders(filters?: {
  pizzaDayId?: string
  status?: string
  search?: string
}) {
  const supabase = await createClient()
  let query = supabase
    .from('orders')
    .select('*, order_items(*), time_slots(*), pizza_days(*)')
    .order('created_at', { ascending: false })

  if (filters?.pizzaDayId) {
    query = query.eq('pizza_day_id', filters.pizzaDayId)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.search) {
    query = query.or(
      `customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = await createClient()

  if (status === 'zrusena') {
    const { data, error } = await supabase.rpc('cancel_order', {
      p_order_id: orderId,
    })
    if (error || !data) {
      return { error: 'Nepodarilo sa zrušiť objednávku' }
    }
  } else {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) return { error: 'Nepodarilo sa zmeniť stav objednávky' }
  }

  revalidatePath('/admin/objednavky')
  return { success: true }
}

export async function deleteOrder(orderId: string) {
  const supabase = await createClient()

  // First get the order to check if we need to decrement capacity
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('time_slot_id, pizza_count, status')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    return { error: 'Objednávka nebola nájdená' }
  }

  // If the order wasn't cancelled, decrement the capacity counter
  if (order.status !== 'zrusena') {
    await supabase.rpc('cancel_order', { p_order_id: orderId })
  }

  // Delete order (order_items cascade automatically)
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)

  if (error) return { error: 'Nepodarilo sa vymazať objednávku' }

  revalidatePath('/admin/objednavky')
  return { success: true }
}

export async function getOrderStats(pizzaDayId?: string) {
  const supabase = await createClient()

  let query = supabase.from('orders').select('*')
  if (pizzaDayId) {
    query = query.eq('pizza_day_id', pizzaDayId)
  }

  const { data, error } = await query
  if (error) return null

  const stats = {
    total: data.length,
    nova: 0,
    potvrdena: 0,
    pripravuje_sa: 0,
    hotova: 0,
    vydana: 0,
    zrusena: 0,
    totalRevenue: 0,
    totalPizzas: 0,
  }

  data.forEach((order) => {
    stats[order.status as keyof typeof stats] = (stats[order.status as keyof typeof stats] as number) + 1
    if (order.status !== 'zrusena') {
      stats.totalRevenue += Number(order.total_price)
      stats.totalPizzas += order.pizza_count
    }
  })

  return stats
}
