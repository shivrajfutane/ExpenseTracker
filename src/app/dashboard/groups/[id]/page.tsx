import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PlusCircle, Users, Settings, Download, Receipt, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InviteMembersDialog } from '@/components/groups/InviteMembersDialog'
import { SplitExpenseDialog } from '@/components/groups/SplitExpenseDialog'
import { SplitExpenseActions } from '@/components/groups/SplitExpenseActions'
import { SettleUpDialog } from '@/components/groups/SettleUpDialog'
import { GroupSettingsDialog } from '@/components/groups/GroupSettingsDialog'
import { ActivityFeed } from '@/components/groups/ActivityFeed'
import { NotificationManager } from '@/components/groups/NotificationManager'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  try {
    // 1. Fetch Group details
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single()

    if (groupError || !group) {
        if (groupError?.code === 'PGRST116') return notFound()
        throw groupError || new Error('Group not found')
    }

    const isCreator = user.id === group.creator_id

    // 1b. Fetch User Profile for Currency
    const { data: profile } = await supabase
        .from('profiles')
        .select('currency')
        .eq('id', user.id)
        .single()

    const currency = profile?.currency || '₹'

    // 2. Fetch Group Members with Profiles
    const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select(`
            *,
            profile:profiles(*)
        `)
        .eq('group_id', id)

    if (membersError) throw membersError

    // 3a. Fetch Split Expenses
    const { data: splitExpenses, error: expensesError } = await supabase
        .from('split_expenses')
        .select('*, splits:expense_splits(*)')
        .order('date', { ascending: false })
        .eq('group_id', id)

    if (expensesError) throw expensesError

    // 3b. Fetch Settlements
    const { data: settlements, error: settlementsError } = await supabase
        .from('settlements')
        .select('*')
        .eq('group_id', id)
    
    if (settlementsError && settlementsError.code !== 'PGRST116') throw settlementsError
    
    // 4. Calculate Group Balances
    let youPaidTotal = 0
    let yourShareTotal = 0

    splitExpenses?.forEach((expense: any) => {
        if (expense.paid_by === user.id) {
        youPaidTotal += Number(expense.total_amount)
        }
        
        const yourSplit = expense.splits?.find((s: any) => s.user_id === user.id)
        if (yourSplit) {
        yourShareTotal += Number(yourSplit.owed_amount)
        }
    })

    // 4b. Settlement logic
    settlements?.forEach((settlement: any) => {
        if (settlement.paid_by === user.id) {
        youPaidTotal += Number(settlement.amount)
        }
        if (settlement.paid_to === user.id) {
        yourShareTotal += Number(settlement.amount)
        }
    })

    const netBalance = youPaidTotal - yourShareTotal
    const youAreOwed = netBalance > 0 ? netBalance : 0
    const youOwe = netBalance < 0 ? Math.abs(netBalance) : 0

    return (
        <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/dashboard/groups">
            <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            </Link>
            <span className="text-sm text-zinc-500 font-medium">Back to Groups</span>
        </div>

        <NotificationManager groupId={id} currentUserId={user.id} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
                <p className="text-muted-foreground mt-1 text-zinc-500 flex items-center gap-2">
                <Users className="h-4 w-4" />
                {members?.length || 1} Member{(members?.length || 1) !== 1 ? 's' : ''}
                </p>
            </div>
            {isCreator && (
                <GroupSettingsDialog group={group} members={members || []} isCreator={isCreator} />
            )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
            <SettleUpDialog groupId={id} currentUserId={user.id} members={members || []} />
            <InviteMembersDialog groupId={id} />
            <SplitExpenseDialog groupId={id} members={members || []} />
            </div>
        </div>

        {/* CSV Export Button (Utility) */}
        <div className="flex justify-end -mt-4">
            <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-zinc-900 group"
                onClick={async () => {
                    'use client';
                    const header = "Date,Title,Amount,Paid By\n";
                    const rows = (splitExpenses || []).map((exp: any) => 
                        `${format(new Date(exp.date), 'yyyy-MM-dd')},${exp.title.replace(/,/g, '')},${exp.total_amount},${exp.paid_by}`
                    ).join("\n");
                    const blob = new Blob([header + rows], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.setAttribute('hidden', '');
                    a.setAttribute('href', url);
                    a.setAttribute('download', `expenses-${group.name}.csv`);
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }}
            >
                <Download className="mr-2 h-3 w-3 transition-transform group-hover:-translate-y-0.5" />
                Download History (CSV)
            </Button>
        </div>

        {/* Balances Section MVP */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/50">
            <CardHeader className="pb-2">
                <CardDescription className="text-blue-600 dark:text-blue-400 font-medium">You Owe</CardDescription>
                <CardTitle className="text-2xl text-blue-700 dark:text-blue-300">
                    {currency}{youOwe.toFixed(2)}
                </CardTitle>
            </CardHeader>
            </Card>
            
            <Card className="shadow-sm bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/50">
            <CardHeader className="pb-2">
                <CardDescription className="text-emerald-600 dark:text-emerald-400 font-medium">You are Owed</CardDescription>
                <CardTitle className="text-2xl text-emerald-700 dark:text-emerald-300">
                    {currency}{youAreOwed.toFixed(2)}
                </CardTitle>
            </CardHeader>
            </Card>
        </div>

        {/* Expenses Feed */}
        <h2 className="text-xl font-semibold mt-8 mb-4">Latest Expenses</h2>
        
        {!splitExpenses || splitExpenses.length === 0 ? (
            <Card className="border-dashed shadow-sm">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <div className="h-16 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <PlusCircle className="h-8 w-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No expenses yet</h3>
                <p className="text-sm text-zinc-500 max-w-sm mt-2 mb-6">
                Add your first shared expense to see who owes what!
                </p>
                <SplitExpenseDialog groupId={id} members={members || []} />
            </CardContent>
            </Card>
        ) : (
            <div className="space-y-4">
            {splitExpenses.map((expense: any) => (
                <Card key={expense.id} className="shadow-sm border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow">
                    <CardHeader className="py-4 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <Receipt className="h-5 w-5 text-zinc-500" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold">{expense.title}</CardTitle>
                                <CardDescription className="text-xs">{format(new Date(expense.date), 'MMM dd, yyyy')}</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="font-mono font-bold text-lg">
                                {currency}{Number(expense.total_amount).toFixed(2)}
                            </div>
                            <SplitExpenseActions 
                            expense={expense} 
                            groupId={id}
                            members={members || []}
                            canEdit={user.id === expense.created_by || user.id === group.creator_id} 
                            />
                        </div>
                    </CardHeader>
                </Card>
            ))}
            </div>
        )}

        {/* Activity Feed Section */}
        <h2 className="text-xl font-bold mt-12 mb-4 flex items-center gap-2 uppercase tracking-tight">
            <Clock className="h-5 w-5 text-zinc-400" />
            Recent Activity
        </h2>
        <ActivityFeed groupId={id} currentUserId={user.id} />
        </div>
    )
  } catch (error: any) {
    console.error('Group Detail Error:', error)
    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle className="text-red-900">Database Connection Issue</CardTitle>
                    <CardDescription className="text-red-700">
                        We encountered an error while loading this group. This usually happens if your Database Tables are out of sync with the latest code.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-white rounded-lg border border-red-100">
                        <p className="text-xs font-mono text-red-500 break-all">{error.message || 'Unknown database error'}</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-red-900">How to fix this:</h4>
                        <ol className="text-sm text-red-800 list-decimal pl-4 space-y-1">
                            <li>Go to your <strong>Supabase Dashboard</strong>.</li>
                            <li>Open the <strong>SQL Editor</strong>.</li>
                            <li>Run the latest migration scripts for <strong>activity_logs</strong> and <strong>settlements</strong>.</li>
                            <li>Reload this page.</li>
                        </ol>
                    </div>
                    <Link href="/dashboard" className="inline-block mt-4">
                        <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">
                            Return to Dashboard
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
  }
}
