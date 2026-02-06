import { getPizzaDays } from '@/actions/pizza-days'
import { PizzaDaysClient } from './pizza-days-client'

export default async function PizzaDaysPage() {
  const pizzaDays = await getPizzaDays()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pizza dni</h1>
        <p className="mt-1 text-sm text-gray-500">Spravujte pizza dni a časové okná</p>
      </div>
      <PizzaDaysClient initialDays={pizzaDays} />
    </div>
  )
}
