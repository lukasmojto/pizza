'use client'

import { useActionState, useState } from 'react'
import { createMenuItem, updateMenuItem, deleteMenuItem } from '@/actions/menu'
import {
  Button, Input, Textarea, Select, Label,
  Card, CardContent, Badge,
  Dialog, DialogHeader, DialogContent, DialogFooter,
} from '@/components/ui'
import { useToast } from '@/components/ui/toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { Category, MenuItem } from '@/types'

interface MenuItemWithCategory extends MenuItem {
  categories: { name: string } | null
}

interface Props {
  initialItems: MenuItemWithCategory[]
  categories: Category[]
}

function ItemForm({
  categories,
  item,
  action,
  state,
  pending,
}: {
  categories: Category[]
  item?: MenuItem | null
  action: (formData: FormData) => void
  state: { error?: string; success?: boolean } | null
  pending: boolean
}) {
  return (
    <form action={action}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <DialogContent className="space-y-4 max-h-[60vh] overflow-y-auto">
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <div>
          <Label htmlFor="item-category">Kategória</Label>
          <Select id="item-category" name="category_id" required defaultValue={item?.category_id ?? ''} className="mt-1">
            <option value="">Vyberte kategóriu</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="item-name">Názov</Label>
          <Input id="item-name" name="name" required defaultValue={item?.name ?? ''} className="mt-1" />
        </div>

        <div>
          <Label htmlFor="item-desc">Popis</Label>
          <Textarea id="item-desc" name="description" defaultValue={item?.description ?? ''} className="mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="item-price">Cena (EUR)</Label>
            <Input id="item-price" name="price" type="number" step="0.01" required defaultValue={item?.price ?? ''} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="item-weight">Gramáž (g)</Label>
            <Input id="item-weight" name="weight_grams" type="number" defaultValue={item?.weight_grams ?? ''} className="mt-1" />
          </div>
        </div>

        <div>
          <Label htmlFor="item-image">Obrázok</Label>
          <Input id="item-image" name="image" type="file" accept="image/*" className="mt-1" />
        </div>

        <div>
          <Label htmlFor="item-sort">Poradie</Label>
          <Input id="item-sort" name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} className="mt-1" />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="item-active"
            name="active"
            type="checkbox"
            defaultChecked={item?.active ?? true}
            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <Label htmlFor="item-active">Aktívna</Label>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button type="submit" loading={pending}>
          {item ? 'Uložiť' : 'Vytvoriť'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function MenuItemsClient({ initialItems, categories }: Props) {
  const { toast } = useToast()
  const [editItem, setEditItem] = useState<MenuItemWithCategory | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const [createState, createAction, createPending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await createMenuItem(prev, formData)
      if (result?.success) {
        setShowCreate(false)
        toast('Položka vytvorená', 'success')
      }
      return result
    },
    null
  )

  const [updateState, updateAction, updatePending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await updateMenuItem(prev, formData)
      if (result?.success) {
        setEditItem(null)
        toast('Položka aktualizovaná', 'success')
      }
      return result
    },
    null
  )

  async function handleDelete(id: string) {
    if (!confirm('Naozaj chcete vymazať túto položku?')) return
    const result = await deleteMenuItem(id)
    if (result?.error) {
      toast(result.error, 'error')
    } else {
      toast('Položka vymazaná', 'success')
    }
  }

  return (
    <>
      <div className="mb-4">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nová položka
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-500">
                <th className="px-6 py-3">Názov</th>
                <th className="px-6 py-3">Kategória</th>
                <th className="px-6 py-3">Cena</th>
                <th className="px-6 py-3">Stav</th>
                <th className="px-6 py-3 text-right">Akcie</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.weight_grams && (
                        <p className="text-sm text-gray-500">{item.weight_grams}g</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {item.categories?.name}
                  </td>
                  <td className="px-6 py-4 font-medium">{formatPrice(item.price)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={item.active ? 'success' : 'default'}>
                      {item.active ? 'Aktívna' : 'Neaktívna'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditItem(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Žiadne položky. Vytvorte prvú položku menu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader onClose={() => setShowCreate(false)}>Nová položka menu</DialogHeader>
        <ItemForm categories={categories} action={createAction} state={createState} pending={createPending} />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)}>
        <DialogHeader onClose={() => setEditItem(null)}>Upraviť položku</DialogHeader>
        {editItem && (
          <ItemForm
            key={editItem.id}
            categories={categories}
            item={editItem}
            action={updateAction}
            state={updateState}
            pending={updatePending}
          />
        )}
      </Dialog>
    </>
  )
}
