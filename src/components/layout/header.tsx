import Link from 'next/link'
import { Pizza } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { UserMenu } from './user-menu'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userMenuData: { email?: string; fullName?: string | null } | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    userMenuData = {
      email: user.email,
      fullName: profile?.full_name ?? null,
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-red-600">
          <Pizza className="h-7 w-7" />
          <span>Pizza na Objednávku</span>
        </Link>
        <UserMenu user={userMenuData} />
      </div>
    </header>
  )
}
