import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function GroupsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch groups visible to the user
  const { data: groups } = await supabase
    .from('groups')
    .select(`
      *,
      group_members(count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Split Expenses</h1>
          <p className="text-muted-foreground mt-1 text-zinc-500">
            Create groups, invite friends, and split bills easily.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateGroupDialog />
        </div>
      </div>

      {!groups || groups.length === 0 ? (
        <Card className="border-dashed shadow-sm bg-zinc-50/50 dark:bg-zinc-900/50">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="relative mb-6">
                <img src="/logo.svg" alt="Logo" className="relative h-16 w-16 rounded-2xl object-cover shadow-lg dark:invert mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 italic">Financial teamwork starts here.</h3>
            <p className="text-sm text-zinc-500 max-w-sm mt-3 mb-8">
              Split bills with roommates, friends, or family. Create your first group and stop doing manual math.
            </p>
            <CreateGroupDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group: any) => {
            const memberCount = group.group_members?.[0]?.count || 1;
            return (
                <Link key={group.id} href={`/dashboard/groups/${group.id}`}>
                <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm cursor-pointer h-full">
                    <CardHeader>
                    <CardTitle className="flex justify-between items-start gap-4">
                        <span className="truncate">{group.name}</span>
                    </CardTitle>
                    <CardDescription>
                        Created {format(new Date(group.created_at), 'MMM dd, yyyy')}
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg w-fit">
                        <Users className="h-4 w-4" />
                        <span>{memberCount} Member{memberCount !== 1 ? 's' : ''}</span>
                    </div>
                    </CardContent>
                </Card>
                </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
