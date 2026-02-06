'use client'

import { useActionState, useState } from 'react'
import { createPizzaDay, updatePizzaDay, deletePizzaDay } from '@/actions/pizza-days'
import {
  Button, Input, Textarea, Label,
  Card, CardContent, Badge,
  Dialog, DialogHeader, DialogContent, DialogFooter,
} from '@/components/ui'
import { useToast } from '@/components/ui/toast'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { formatDateSk } from '@/lib/utils'
import Link from 'next/link'
import type { PizzaDay } from '@/types'

interface PizzaDayWithSlots extends PizzaDay {
  time_slots: { count: number }[]
}

interface Props {
  initialDays: PizzaDayWithSlots[]
}

export function PizzaDaysClient({ initialDays }: Props) {
  const { toast } = useToast()
  const [editDay, setEditDay] = useState<PizzaDay | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const [createState, createAction, createPending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await createPizzaDay(prev, formData)
      if (result?.success) {
        setShowCreate(false)
        toast('Pizza deň vytvorený', 'success')
      }
      return result
    },
    null
  )

  const [updateState, updateAction, updatePending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await updatePizzaDay(prev, formData)
      if (result?.success) {
        setEditDay(null)
        toast('Pizza deň aktualizovaný', 'success')
      }
      return result
    },
    null
  )

  async function handleDelete(id: string) {
    if (!confirm('Naozaj chcete vymazať tento pizza deň?')) return
    const result = await deletePizzaDay(id)
    if (result?.error) {
      toast(result.error, 'error')
    } else {
      toast('Pizza deň vymazaný', 'success')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <div className="mb-4">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nový pizza deň
        </Button>
      </div>

      <div className="space-y-3">
        {initialDays.map((day) => {
          const isPast = day.date < today
          const slotsCount = day.time_slots?.[0]?.count ?? 0
          return (
            <Card key={day.id} className={isPast ? 'opacity-60' : ''}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{formatDateSk(day.date)}</p>
                    {day.note && <p className="text-sm text-gray-500">{day.note}</p>}
                    <p className="text-sm text-gray-400">{slotsCount} časových okien</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={day.active ? 'success' : 'default'}>
                    {day.active ? 'Aktívny' : 'Neaktívny'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => setEditDay(day)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(day.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                  <Link href={`/admin/pizza-dni/${day.id}`}>
                    <Button variant="outline" size="sm">
                      Okná <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {initialDays.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Žiadne pizza dni. Vytvorte prvý pizza deň.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader onClose={() => setShowCreate(false)}>Nový pizza deň</DialogHeader>
        <form action={createAction}>
          <DialogContent className="space-y-4">
            {createState?.error && <p className="text-sm text-red-600">{createState.error}</p>}
            <div>
              <Label htmlFor="create-date">Dátum</Label>
              <Input id="create-date" name="date" type="date" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="create-note">Poznámka</Label>
              <Textarea id="create-note" name="note" className="mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <input id="create-active" name="active" type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-red-600" />
              <Label htmlFor="create-active">Aktívny</Label>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Zrušiť</Button>
            <Button type="submit" loading={createPending}>Vytvoriť</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDay} onClose={() => setEditDay(null)}>
        <DialogHeader onClose={() => setEditDay(null)}>Upraviť pizza deň</DialogHeader>
        <form action={updateAction}>
          <input type="hidden" name="id" value={editDay?.id ?? ''} />
          <DialogContent className="space-y-4">
            {updateState?.error && <p className="text-sm text-red-600">{updateState.error}</p>}
            <div>
              <Label htmlFor="edit-date">Dátum</Label>
              <Input id="edit-date" name="date" type="date" required defaultValue={editDay?.date ?? ''} key={editDay?.id} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="edit-note">Poznámka</Label>
              <Textarea id="edit-note" name="note" defaultValue={editDay?.note ?? ''} key={`note-${editDay?.id}`} className="mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <input id="edit-active" name="active" type="checkbox" defaultChecked={editDay?.active} key={`active-${editDay?.id}`} className="h-4 w-4 rounded border-gray-300 text-red-600" />
              <Label htmlFor="edit-active">Aktívny</Label>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setEditDay(null)}>Zrušiť</Button>
            <Button type="submit" loading={updatePending}>Uložiť</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}
