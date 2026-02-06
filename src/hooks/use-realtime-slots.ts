'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TimeSlot } from '@/types'

export function useRealtimeSlots(pizzaDayId: string, initialSlots: TimeSlot[]) {
  const [slots, setSlots] = useState(initialSlots)

  useEffect(() => {
    setSlots(initialSlots)
  }, [initialSlots])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`time_slots:${pizzaDayId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'time_slots',
          filter: `pizza_day_id=eq.${pizzaDayId}`,
        },
        (payload) => {
          setSlots((prev) =>
            prev.map((slot) =>
              slot.id === payload.new.id ? { ...slot, ...payload.new } as TimeSlot : slot
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pizzaDayId])

  return slots
}
