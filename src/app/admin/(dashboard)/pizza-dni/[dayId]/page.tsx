import { getPizzaDay } from '@/actions/pizza-days'
import { getTimeSlots } from '@/actions/time-slots'
import { TimeSlotsClient } from './time-slots-client'
import { formatDateSk } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function PizzaDayDetailPage({
  params,
}: {
  params: Promise<{ dayId: string }>
}) {
  const { dayId } = await params
  const [day, slots] = await Promise.all([getPizzaDay(dayId), getTimeSlots(dayId)])

  return (
    <div>
      <Link href="/admin/pizza-dni" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" />
        Späť na pizza dni
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Časové okná</h1>
        <p className="mt-1 text-sm text-gray-500">{formatDateSk(day.date)}</p>
      </div>
      <TimeSlotsClient pizzaDayId={dayId} initialSlots={slots} />
    </div>
  )
}
