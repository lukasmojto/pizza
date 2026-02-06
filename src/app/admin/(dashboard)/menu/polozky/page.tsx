import { getMenuItems, getCategories } from '@/actions/menu'
import { MenuItemsClient } from './menu-items-client'

export default async function MenuItemsPage() {
  const [items, categories] = await Promise.all([getMenuItems(), getCategories()])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Položky menu</h1>
        <p className="mt-1 text-sm text-gray-500">Spravujte položky menu</p>
      </div>
      <MenuItemsClient initialItems={items} categories={categories} />
    </div>
  )
}
