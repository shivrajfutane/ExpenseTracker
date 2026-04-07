import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const url = request.nextUrl.clone()
  const code = url.searchParams.get('code')

  if (code && !url.pathname.startsWith('/auth/callback')) {
    const callbackRedirectUrl = new URL('/auth/callback', request.url)
    callbackRedirectUrl.searchParams.set('code', code)
    return NextResponse.redirect(callbackRedirectUrl)
  }

  // Protect /dashboard routes
  if (url.pathname.startsWith('/dashboard')) {
    if (!session) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated users away from /login to /dashboard
  if (url.pathname === '/login') {
    if (session) {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/login', '/auth/callback'],
}
