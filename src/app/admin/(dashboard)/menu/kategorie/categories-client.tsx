'use client'

import { useActionState, useState } from 'react'
import { createCategory, updateCategory, deleteCategory } from '@/actions/menu'
import { Button, Input, Label, Card, CardContent, Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/ui'
import { useToast } from '@/components/ui/toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Category } from '@/types'

interface Props {
  initialCategories: Category[]
}

export function CategoriesClient({ initialCategories }: Props) {
  const { toast } = useToast()
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const [createState, createAction, createPending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await createCategory(prev, formData)
      if (result?.success) {
        setShowCreate(false)
        toast('Kategória vytvorená', 'success')
      }
      return result
    },
    null
  )

  const [updateState, updateAction, updatePending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await updateCategory(prev, formData)
      if (result?.success) {
        setEditCategory(null)
        toast('Kategória aktualizovaná', 'success')
      }
      return result
    },
    null
  )

  async function handleDelete(id: string) {
    if (!confirm('Naozaj chcete vymazať túto kategóriu?')) return
    const result = await deleteCategory(id)
    if (result?.error) {
      toast(result.error, 'error')
    } else {
      toast('Kategória vymazaná', 'success')
    }
  }

  return (
    <>
      <div className="mb-4">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nová kategória
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-500">
                <th className="px-6 py-3">Názov</th>
                <th className="px-6 py-3">Poradie</th>
                <th className="px-6 py-3 text-right">Akcie</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-6 py-4 text-gray-500">{cat.sort_order}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditCategory(cat)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cat.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialCategories.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    Žiadne kategórie. Vytvorte prvú kategóriu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader onClose={() => setShowCreate(false)}>Nová kategória</DialogHeader>
        <form action={createAction}>
          <DialogContent className="space-y-4">
            {createState?.error && (
              <p className="text-sm text-red-600">{createState.error}</p>
            )}
            <div>
              <Label htmlFor="create-name">Názov</Label>
              <Input id="create-name" name="name" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="create-sort">Poradie</Label>
              <Input id="create-sort" name="sort_order" type="number" defaultValue="0" className="mt-1" />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>
              Zrušiť
            </Button>
            <Button type="submit" loading={createPending}>
              Vytvoriť
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editCategory} onClose={() => setEditCategory(null)}>
        <DialogHeader onClose={() => setEditCategory(null)}>Upraviť kategóriu</DialogHeader>
        <form action={updateAction}>
          <input type="hidden" name="id" value={editCategory?.id ?? ''} />
          <DialogContent className="space-y-4">
            {updateState?.error && (
              <p className="text-sm text-red-600">{updateState.error}</p>
            )}
            <div>
              <Label htmlFor="edit-name">Názov</Label>
              <Input
                id="edit-name"
                name="name"
                required
                defaultValue={editCategory?.name ?? ''}
                key={editCategory?.id}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-sort">Poradie</Label>
              <Input
                id="edit-sort"
                name="sort_order"
                type="number"
                defaultValue={editCategory?.sort_order ?? 0}
                key={`sort-${editCategory?.id}`}
                className="mt-1"
              />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setEditCategory(null)}>
              Zrušiť
            </Button>
            <Button type="submit" loading={updatePending}>
              Uložiť
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}
