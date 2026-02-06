import { createClient } from '@/lib/supabase/server'
import { formatDateSk } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { PizzaDayClient } from './pizza-day-client'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dayId: string }>
}): Promise<Metadata> {
  const { dayId } = await params
  const supabase = await createClient()
  const { data: day } = await supabase
    .from('pizza_days')
    .select('date')
    .eq('id', dayId)
    .single()

  return {
    title: day ? `Pizza deň - ${formatDateSk(day.date)}` : 'Pizza deň',
  }
}

export default async function PizzaDayPage({
  params,
}: {
  params: Promise<{ dayId: string }>
}) {
  const { dayId } = await params
  const supabase = await createClient()

  const [dayResult, slotsResult, categoriesResult] = await Promise.all([
    supabase.from('pizza_days').select('*').eq('id', dayId).eq('active', true).single(),
    supabase
      .from('time_slots')
      .select('*')
      .eq('pizza_day_id', dayId)
      .order('time_from', { ascending: true }),
    supabase
      .from('categories')
      .select('*, menu_items(*)')
      .order('sort_order', { ascending: true }),
  ])

  if (!dayResult.data) notFound()

  const day = dayResult.data
  const slots = slotsResult.data || []
  // Filter to only active menu items
  const categories = (categoriesResult.data || []).map((cat) => ({
    ...cat,
    menu_items: (cat.menu_items || []).filter((item: { active: boolean }) => item.active),
  })).filter((cat) => cat.menu_items.length > 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {formatDateSk(day.date)}
        </h1>
        {day.note && <p className="mt-2 text-gray-500">{day.note}</p>}
      </div>

      <PizzaDayClient
        pizzaDayId={dayId}
        initialSlots={slots}
        categories={categories}
      />
    </div>
  )
}
