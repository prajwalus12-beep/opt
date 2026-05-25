import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables. Please check your .env.local file.')
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/admin/login')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')

  // Not authenticated
  if (!user) {
    if (isAdminRoute || isDashboardRoute) {
      // Redirect to correct login based on path
      const url = request.nextUrl.clone()
      url.pathname = isAdminRoute ? '/admin/login' : '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // User is authenticated, fetch role if they are trying to access protected routes
  if (user && (isAdminRoute || isDashboardRoute || isAuthPage)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'employee'

    // Redirect authenticated users away from auth pages
    if (isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = role === 'admin' ? '/admin/presence' : '/dashboard/presence'
      return NextResponse.redirect(url)
    }

    // Protect admin routes
    if (isAdminRoute && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/presence'
      return NextResponse.redirect(url)
    }

    // Redirect admins away from employee dashboard to their own presence page
    if (isDashboardRoute && role === 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/presence'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
