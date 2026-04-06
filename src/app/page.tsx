import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
