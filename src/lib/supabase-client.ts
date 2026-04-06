import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    if (typeof window === 'undefined') {
        // Return a mock client that handles the lack of keys gracefully during build pre-rendering
        return {
            auth: { onAuthStateChange: () => {}, getSession: async () => ({ data: { session: null } }) },
            from: () => ({ select: () => ({ eq: () => ({ order: () => ({ range: () => ({ data: [], count: 0 }) }) }) }) })
        } as any
    }
    throw new Error('Supabase environment variables are missing')
  }

  return createBrowserClient(url, key)
}
