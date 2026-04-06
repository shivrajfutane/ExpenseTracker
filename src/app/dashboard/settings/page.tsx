import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/profile/SettingsForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-zinc-500">
          Manage your account settings and financial preferences.
        </p>
      </div>

      <Separator />

      <Card className="border-none shadow-sm dark:bg-zinc-900/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Account & Preferences</CardTitle>
          <CardDescription>
            Update your display information and how we calculate your budget.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm initialData={profile} />
        </CardContent>
      </Card>
    </div>
  )
}
