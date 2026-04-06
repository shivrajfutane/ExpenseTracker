import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Wallet, TrendingUp, Calendar, Mail } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch Full Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch Current Month's Spending
  const startMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const endMonth = format(endOfMonth(new Date()), 'yyyy-MM-dd')

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', user.id)
    .gte('date', startMonth)
    .lte('date', endMonth)

  const totalSpent = expenses?.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0) || 0
  const budget = profile?.monthly_budget || 0
  const percentUsed = budget > 0 ? (totalSpent / budget) * 100 : 0
  const currency = profile?.currency || '$'

  const initials = user.email?.split('@')[0].substring(0, 2).toUpperCase() || 'U'

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground mt-1 text-zinc-500">
          Your personal footprint in the financial world.
        </p>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1 border-none shadow-sm dark:bg-zinc-900/40 backdrop-blur-md">
          <CardHeader className="flex flex-col items-center justify-center p-8">
            <Avatar className="h-24 w-24 mb-4 ring-2 ring-zinc-100 dark:ring-zinc-800 ring-offset-4 ring-offset-white dark:ring-offset-zinc-950">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-2xl bg-zinc-100 dark:bg-zinc-800">{initials}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl font-bold text-center">
                {profile?.full_name || 'Premium User'}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-3 w-3" />
                {profile?.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl">
                 <p className="text-sm font-medium mb-1 flex items-center gap-2">
                    <User className="h-4 w-4 text-zinc-400" />
                    Bio
                 </p>
                 <p className="text-sm text-zinc-500 italic">
                    {profile?.bio || 'No bio added yet. Add one in settings!'}
                 </p>
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-500 px-2">
                 <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member since
                 </div>
                 <span>{format(new Date(user.created_at), 'MMM yyyy')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Financial Status Card */}
        <Card className="lg:col-span-2 border-none shadow-sm dark:bg-zinc-900/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-zinc-500" />
                Financial Snapshot
            </CardTitle>
            <CardDescription>How you're tracking against your goal this month.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 py-6 px-10">
            <div className="grid grid-cols-2 gap-8 mb-4">
                 <div>
                    <h4 className="text-sm font-medium text-zinc-500 mb-2">Spent this month</h4>
                    <p className="text-3xl font-bold">{currency}{totalSpent.toFixed(2)}</p>
                 </div>
                 <div>
                    <h4 className="text-sm font-medium text-zinc-500 mb-2">Monthly Budget</h4>
                    <p className="text-3xl font-bold text-emerald-500">{currency}{budget.toFixed(2)}</p>
                 </div>
            </div>
            
            <div className="space-y-3">
                 <div className="flex justify-between text-sm font-medium">
                    <span>Budget Usage</span>
                    <span className={percentUsed > 90 ? 'text-red-500' : 'text-zinc-500'}>
                        {percentUsed.toFixed(1)}%
                    </span>
                 </div>
                 <Progress value={percentUsed} className="h-3" />
                 <p className="text-xs text-zinc-500 italic">
                    {percentUsed > 100 
                        ? "You've exceeded your budget! Time to reel it in."
                        : percentUsed > 80 
                        ? "Getting close! Keep an eye on those non-essentials."
                        : "Looking good! You're well within your limits."}
                 </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
