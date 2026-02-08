import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect admin routes (except login page)
  if (
    request.nextUrl.pathname.startsWith('/admin') &&
    !request.nextUrl.pathname.startsWith('/admin/prihlasenie')
  ) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/prihlasenie'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from login page
  if (request.nextUrl.pathname === '/admin/prihlasenie' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/objednavky'
    return NextResponse.redirect(url)
  }

  // Protect customer routes (/profil, /objednavky)
  const customerProtectedPaths = ['/profil', '/objednavky']
  const isCustomerProtected = customerProtectedPaths.some(
    (path) => request.nextUrl.pathname.startsWith(path)
  )
  if (isCustomerProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/prihlasenie'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
