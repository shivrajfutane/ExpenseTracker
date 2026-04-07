import { createClient } from '@/lib/supabase-server'
import { LandingPage } from '@/components/landing/LandingPage'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  }

  return <LandingPage session={session} />
}
