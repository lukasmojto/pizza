import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/domov'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // For Google OAuth: update full_name from Google metadata if not set
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const googleName = user.user_metadata?.full_name || user.user_metadata?.name
        if (googleName) {
          const { data: profile } = await supabase
            .from('customer_profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

          if (profile && !profile.full_name) {
            await supabase
              .from('customer_profiles')
              .update({ full_name: googleName })
              .eq('id', user.id)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/prihlasenie?error=callback`)
}
