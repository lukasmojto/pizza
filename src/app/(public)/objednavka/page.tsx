import { createClient } from '@/lib/supabase/server'
import { CheckoutClient } from './checkout-client'
import type { CustomerProfile } from '@/types'

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let customerProfile: CustomerProfile | null = null
  let customerId: string | undefined

  if (user) {
    customerId = user.id
    const { data } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    customerProfile = data
  }

  return <CheckoutClient customerProfile={customerProfile} customerId={customerId} />
}
