import { getUpcomingPizzaDays } from '@/actions/pizza-days'
import { formatDateSk } from '@/lib/utils'
import { formatTime, isSlotAvailable, getSlotCapacityPercent } from '@/lib/utils'
import { CalendarDays, Clock, Pizza } from 'lucide-react'
import Link from 'next/link'
import type { TimeSlot } from '@/types'

export default async function HomePage() {
  const pizzaDays = await getUpcomingPizzaDays()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Hero */}
      <div className="mb-12 text-center">
        <Pizza className="mx-auto h-16 w-16 text-red-600" />
        <h1 className="mt-4 text-4xl font-bold text-gray-900">Pizza na Objednávku</h1>
        <p className="mt-3 text-lg text-gray-500">
          Vyberte si z našich pizza dní a objednajte si čerstvú pizzu
        </p>
      </div>

      {/* Pizza days */}
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        <CalendarDays className="mr-2 inline h-6 w-6" />
        Nadchádzajúce pizza dni
      </h2>

      {pizzaDays.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <CalendarDays className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-lg font-medium text-gray-500">
            Momentálne nie sú naplánované žiadne pizza dni
          </p>
          <p className="mt-2 text-sm text-gray-400">Skúste to neskôr</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pizzaDays.map((day) => {
            const slots = (day.time_slots as TimeSlot[]) || []
            const availableSlots = slots.filter(isSlotAvailable)
            const hasAvailability = availableSlots.length > 0

            return (
              <Link
                key={day.id}
                href={`/pizza-day/${day.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-red-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {formatDateSk(day.date)}
                    </h3>
                    {day.note && (
                      <p className="mt-1 text-sm text-gray-500">{day.note}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {slots.map((slot) => {
                        const available = isSlotAvailable(slot)
                        const percent = getSlotCapacityPercent(slot)
                        return (
                          <span
                            key={slot.id}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${
                              available
                                ? 'bg-green-50 text-green-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(slot.time_from)} - {formatTime(slot.time_to)}
                            {available && (
                              <span className="text-xs">
                                ({100 - percent}% voľné)
                              </span>
                            )}
                            {!available && <span className="text-xs">(plné)</span>}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {hasAvailability ? (
                      <span className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white">
                        Objednať
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-500">
                        Obsadené
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
