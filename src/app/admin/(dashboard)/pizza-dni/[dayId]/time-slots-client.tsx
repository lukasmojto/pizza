'use client'

import { useActionState, useState } from 'react'
import { createTimeSlot, updateTimeSlot, deleteTimeSlot } from '@/actions/time-slots'
import {
  Button, Input, Label,
  Card, CardContent, Badge,
  Dialog, DialogHeader, DialogContent, DialogFooter,
} from '@/components/ui'
import { useToast } from '@/components/ui/toast'
import { Plus, Pencil, Trash2, Clock } from 'lucide-react'
import { formatTime, getSlotCapacityPercent } from '@/lib/utils'
import type { TimeSlot } from '@/types'

interface Props {
  pizzaDayId: string
  initialSlots: TimeSlot[]
}

export function TimeSlotsClient({ pizzaDayId, initialSlots }: Props) {
  const { toast } = useToast()
  const [editSlot, setEditSlot] = useState<TimeSlot | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const [createState, createAction, createPending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await createTimeSlot(prev, formData)
      if (result?.success) {
        setShowCreate(false)
        toast('Časové okno vytvorené', 'success')
      }
      return result
    },
    null
  )

  const [updateState, updateAction, updatePending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await updateTimeSlot(prev, formData)
      if (result?.success) {
        setEditSlot(null)
        toast('Časové okno aktualizované', 'success')
      }
      return result
    },
    null
  )

  async function handleDelete(id: string) {
    if (!confirm('Naozaj chcete vymazať toto časové okno?')) return
    const result = await deleteTimeSlot(id)
    if (result?.error) {
      toast(result.error, 'error')
    } else {
      toast('Časové okno vymazané', 'success')
    }
  }

  return (
    <>
      <div className="mb-4">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nové časové okno
        </Button>
      </div>

      <div className="space-y-3">
        {initialSlots.map((slot) => {
          const percent = getSlotCapacityPercent(slot)
          return (
            <Card key={slot.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                    <Clock className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {formatTime(slot.time_from)} - {formatTime(slot.time_to)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all ${percent >= 90 ? 'bg-red-500' : percent >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">
                        {slot.current_pizza_count}/{slot.max_pizzas}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={slot.is_open ? 'success' : 'danger'}>
                    {slot.is_open ? 'Otvorené' : 'Zatvorené'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => setEditSlot(slot)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(slot.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {initialSlots.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Žiadne časové okná. Vytvorte prvé časové okno.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader onClose={() => setShowCreate(false)}>Nové časové okno</DialogHeader>
        <form action={createAction}>
          <input type="hidden" name="pizza_day_id" value={pizzaDayId} />
          <DialogContent className="space-y-4">
            {createState?.error && <p className="text-sm text-red-600">{createState.error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-from">Čas od</Label>
                <Input id="create-from" name="time_from" type="time" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="create-to">Čas do</Label>
                <Input id="create-to" name="time_to" type="time" required className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="create-max">Max. počet pizz</Label>
              <Input id="create-max" name="max_pizzas" type="number" required defaultValue="10" className="mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <input id="create-open" name="is_open" type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-red-600" />
              <Label htmlFor="create-open">Otvorené</Label>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Zrušiť</Button>
            <Button type="submit" loading={createPending}>Vytvoriť</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editSlot} onClose={() => setEditSlot(null)}>
        <DialogHeader onClose={() => setEditSlot(null)}>Upraviť časové okno</DialogHeader>
        <form action={updateAction}>
          <input type="hidden" name="id" value={editSlot?.id ?? ''} />
          <input type="hidden" name="pizza_day_id" value={pizzaDayId} />
          <DialogContent className="space-y-4">
            {updateState?.error && <p className="text-sm text-red-600">{updateState.error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-from">Čas od</Label>
                <Input id="edit-from" name="time_from" type="time" required defaultValue={editSlot?.time_from?.slice(0, 5) ?? ''} key={editSlot?.id} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-to">Čas do</Label>
                <Input id="edit-to" name="time_to" type="time" required defaultValue={editSlot?.time_to?.slice(0, 5) ?? ''} key={`to-${editSlot?.id}`} className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-max">Max. počet pizz</Label>
              <Input id="edit-max" name="max_pizzas" type="number" required defaultValue={editSlot?.max_pizzas ?? 10} key={`max-${editSlot?.id}`} className="mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <input id="edit-open" name="is_open" type="checkbox" defaultChecked={editSlot?.is_open} key={`open-${editSlot?.id}`} className="h-4 w-4 rounded border-gray-300 text-red-600" />
              <Label htmlFor="edit-open">Otvorené</Label>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setEditSlot(null)}>Zrušiť</Button>
            <Button type="submit" loading={updatePending}>Uložiť</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}
