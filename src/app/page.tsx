import { createClient } from '@/lib/supabase-server'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  return <LandingPage session={session} />
}
