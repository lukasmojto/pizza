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
      // Ensure customer_profiles row exists (trigger may not fire for OAuth)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const googleName = user.user_metadata?.full_name || user.user_metadata?.name
        const { data: profile } = await supabase
          .from('customer_profiles')
          .select('id, full_name')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // Create profile row if it doesn't exist
          await supabase
            .from('customer_profiles')
            .upsert({
              id: user.id,
              email: user.email!,
              full_name: googleName || null,
            })
        } else if (googleName && !profile.full_name) {
          // Update name from Google metadata if not set
          await supabase
            .from('customer_profiles')
            .update({ full_name: googleName })
            .eq('id', user.id)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/prihlasenie?error=callback`)
}
