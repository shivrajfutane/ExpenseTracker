import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/profile/SettingsForm'
import { DeleteAccountDialog } from '@/components/profile/DeleteAccountDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Trash2 } from 'lucide-react'

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

      <Separator />

      <Card className="border-red-500/50 bg-red-500/5 dark:bg-red-500/5 shadow-none">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-500 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-600/80 dark:text-red-400/80">
            Once you delete your account, there is no going back. Please be certain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountDialog email={user.email!} />
        </CardContent>
      </Card>
    </div>
  )
}
