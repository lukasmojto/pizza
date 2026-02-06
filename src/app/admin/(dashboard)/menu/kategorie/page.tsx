import { getCategories } from '@/actions/menu'
import { CategoriesClient } from './categories-client'

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategórie</h1>
          <p className="mt-1 text-sm text-gray-500">Spravujte kategórie menu</p>
        </div>
      </div>
      <CategoriesClient initialCategories={categories} />
    </div>
  )
}
