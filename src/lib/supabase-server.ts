import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase env vars are missing. Make sure to restart your dev server after adding them to .env.local')
    }
    // Return a dummy client to prevent build/prerender crashes
    return {
      auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => {} },
      from: () => ({
        select: () => ({
          eq: () => ({
            gte: () => ({
              lte: () => ({
                order: () => ({
                  range: () => ({ data: [], count: 0 })
                })
              })
            })
          })
        })
      })
    } as any
  }

  return createServerClient(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Re-throw if setAll is called in a place where cookies can't be set
          }
        },
      },
    }
  )
}
