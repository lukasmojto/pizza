'use client'

import { useState } from 'react'
import { useCart } from '@/hooks/use-cart'
import { placeOrder } from '@/actions/orders'
import { checkoutSchema } from '@/lib/validators'
import { formatPrice } from '@/lib/utils'
import { Button, Input, Textarea, Label, Card, CardContent } from '@/components/ui'
import { useToast } from '@/components/ui/toast'
import { ShoppingCart, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { items, pizzaDayId, timeSlotId, removeItem, updateQuantity, getTotalPrice, clearCart, getPizzaCount } = useCart()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalPrice = getTotalPrice()
  const pizzaCount = getPizzaCount()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShoppingCart className="mx-auto h-16 w-16 text-gray-300" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Košík je prázdny</h1>
        <p className="mt-2 text-gray-500">Vyberte si najprv položky z menu</p>
        <Link href="/domov">
          <Button className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Späť na pizza dni
          </Button>
        </Link>
      </div>
    )
  }

  if (!timeSlotId || !pizzaDayId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Vyberte časové okno</h1>
        <p className="mt-2 text-gray-500">Vráťte sa na stránku pizza dňa a vyberte časové okno</p>
        <Link href="/domov">
          <Button className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Späť na pizza dni
          </Button>
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const raw = {
      customerName: formData.get('customerName') as string,
      customerPhone: formData.get('customerPhone') as string,
      customerEmail: formData.get('customerEmail') as string,
      customerNote: formData.get('customerNote') as string,
    }

    const parsed = checkoutSchema.safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach((err) => {
        const key = err.path[0]
        if (key != null) fieldErrors[String(key)] = err.message
      })
      setErrors(fieldErrors)
      setLoading(false)
      return
    }

    const result = await placeOrder({
      timeSlotId: timeSlotId!,
      pizzaDayId: pizzaDayId!,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      customerEmail: parsed.data.customerEmail || undefined,
      customerNote: parsed.data.customerNote || undefined,
      items: items.map((item) => ({
        menuItemId: item.menuItemId,
        itemName: item.name,
        itemPrice: item.price,
        quantity: item.quantity,
      })),
      pizzaCount,
    })

    setLoading(false)

    if (!result.success) {
      toast(result.error || 'Nepodarilo sa odoslať objednávku', 'error')
      return
    }

    clearCart()
    router.push(`/potvrdenie/${result.orderId}`)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Objednávka</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Cart items */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent>
              <h2 className="mb-4 text-lg font-semibold">Položky ({items.length})</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.menuItemId} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{formatPrice(item.price)} / ks</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.menuItemId, Number(e.target.value))}
                        className="rounded border px-2 py-1 text-sm"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      <p className="w-20 text-right font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <button onClick={() => updateQuantity(item.menuItemId, 0)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold">
                <span>Celkom</span>
                <span className="text-red-600">{formatPrice(totalPrice)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer form */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent>
              <h2 className="mb-4 text-lg font-semibold">Vaše údaje</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Meno a priezvisko *</Label>
                  <Input id="customerName" name="customerName" required error={errors.customerName} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Telefón *</Label>
                  <Input id="customerPhone" name="customerPhone" type="tel" required placeholder="+421..." error={errors.customerPhone} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input id="customerEmail" name="customerEmail" type="email" error={errors.customerEmail} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="customerNote">Poznámka</Label>
                  <Textarea id="customerNote" name="customerNote" placeholder="Napr. bez cibule..." className="mt-1" />
                </div>

                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Odoslať objednávku
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
