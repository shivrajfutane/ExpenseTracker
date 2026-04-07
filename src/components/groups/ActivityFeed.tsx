'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { format, formatDistanceToNow } from 'date-fns'
import { 
  PlusCircle, 
  Edit3, 
  Trash2, 
  UserPlus, 
  UserMinus, 
  RefreshCcw, 
  Clock, 
  Filter,
  Undo2,
  ChevronRight,
  Receipt,
  Handshake
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ActivityFeedProps {
  groupId: string;
  currentUserId: string;
}

export function ActivityFeed({ groupId, currentUserId }: ActivityFeedProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const supabase = createClient()

  const fetchLogs = async () => {
    let query = supabase
      .from('activity_logs')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    if (filter === 'added') query = query.ilike('action', '%created%')
    if (filter === 'edited') query = query.ilike('action', '%edited%')
    if (filter === 'deleted') query = query.ilike('action', '%deleted%')

    const { data, error } = await query
    if (data) setLogs(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`group-activity-${groupId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'activity_logs',
        filter: `group_id=eq.${groupId}`
      }, () => {
        fetchLogs()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, filter])

  const handleUndo = async (log: any) => {
    if (log.user_id !== currentUserId) {
        toast.error('You can only undo your own actions')
        return
    }

    toast.promise(new Promise(async (resolve, reject) => {
        try {
            // Undo Logic
            const { action, metadata, expense_id } = log
            
            if (action === 'expense_created' && expense_id) {
                // Delete the created expense
                const { error } = await supabase.from('split_expenses').delete().eq('id', expense_id)
                if (error) throw error
            } 
            else if (action === 'expense_edited' && expense_id && metadata.before) {
                // Restore previous state
                const { error } = await supabase
                    .from('split_expenses')
                    .update({ 
                        title: metadata.before.title, 
                        total_amount: metadata.before.amount 
                    })
                    .eq('id', expense_id)
                if (error) throw error
                
                // Restore splits
                await supabase.from('expense_splits').delete().eq('split_expense_id', expense_id)
                const splitsToRestore = metadata.before.splits.map((s: any) => ({
                    split_expense_id: expense_id,
                    user_id: s.user_id,
                    owed_amount: s.owed_amount
                }))
                await supabase.from('expense_splits').insert(splitsToRestore)
            }
            
            // Delete the log entry itself to "un-log" it
            await supabase.from('activity_logs').delete().eq('id', log.id)
            
            fetchLogs()
            resolve('Action undone successfully')
        } catch (e) {
            reject(e)
        }
    }), {
        loading: 'Undoing action...',
        success: (msg: any) => msg,
        error: 'Failed to undo action'
    })
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'expense_created': return <PlusCircle className="h-4 w-4 text-emerald-500" />
      case 'expense_edited': return <Edit3 className="h-4 w-4 text-blue-500" />
      case 'expense_deleted': return <Trash2 className="h-4 w-4 text-rose-500" />
      case 'member_added': return <UserPlus className="h-4 w-4 text-indigo-500" />
      case 'member_removed': return <UserMinus className="h-4 w-4 text-amber-500" />
      case 'split_updated': return <RefreshCcw className="h-4 w-4 text-purple-500" />
      case 'settlement_added': return <Handshake className="h-4 w-4 text-emerald-500" />
      default: return <Clock className="h-4 w-4 text-zinc-500" />
    }
  }

  const getActionText = (log: any) => {
    const actor = log.user_id === currentUserId ? 'You' : (log.profile?.full_name || 'Someone')
    const expenseTitle = log.metadata?.after?.title || log.metadata?.before?.title || 'an expense'
    
    switch (log.action) {
      case 'expense_created': return <>{actor} added <strong>₹{log.metadata?.after?.amount}</strong> for "{expenseTitle}"</>
      case 'expense_edited': return <>{actor} updated "{expenseTitle}"</>
      case 'expense_deleted': return <>{actor} removed expense "{expenseTitle}"</>
      case 'member_added': return <>{actor} added a new member</>
      case 'member_removed': return <>{actor} removed a member</>
      case 'settlement_added': {
        const amount = log.metadata?.amount
        const targetId = log.metadata?.paid_to
        const targetName = targetId === currentUserId ? 'You' : 'someone'
        return <>{actor} paid <strong>₹{amount}</strong> to {targetName}</>
      }
      default: return `${actor} performed an action`
    }
  }

  // Group logs by date
  const groupedLogs = logs.reduce((groups: any, log) => {
    const date = format(new Date(log.created_at), 'MMMM dd, yyyy')
    if (!groups[date]) groups[date] = []
    groups[date].push(log)
    return groups
  }, {})

  if (loading) {
    return (
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm animate-pulse">
        <div className="p-8 space-y-4">
            <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
            <div className="h-10 w-full bg-zinc-50 dark:bg-zinc-900 rounded-lg"></div>
            <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 w-full bg-zinc-50 dark:bg-zinc-900 rounded-lg"></div>)}
            </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
        <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-zinc-500" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Activity History</CardTitle>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Filter className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={filter} onValueChange={setFilter}>
                    <DropdownMenuRadioItem value="all">All Activities</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="added">Created</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="edited">Edited</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="deleted">Deleted</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-0">
        {logs.length === 0 ? (
            <div className="p-12 text-center text-zinc-400">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No activity recorded yet</p>
            </div>
        ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {Object.entries(groupedLogs).map(([date, dateLogs]: [string, any]) => (
                    <div key={date}>
                        <div className="px-4 py-2 bg-zinc-50/30 dark:bg-zinc-900/30 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-900">
                            {date}
                        </div>
                        <div className="p-1">
                            {dateLogs.map((log: any) => (
                                <div key={log.id} className="group relative flex items-start gap-4 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all duration-200">
                                    <div className="mt-1">
                                        <Avatar className="h-8 w-8 border-2 border-white dark:border-zinc-950 shadow-sm">
                                            <AvatarImage src={log.profile?.avatar_url} />
                                            <AvatarFallback className="text-[10px] bg-zinc-100 dark:bg-zinc-800 font-bold uppercase">
                                                {(log.profile?.full_name || 'U').substring(0, 1)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="flex-shrink-0">{getActionIcon(log.action)}</span>
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                                                {format(new Date(log.created_at), 'HH:mm')} • {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug">
                                            {getActionText(log)}
                                        </p>
                                    </div>
                                    
                                    {log.user_id === currentUserId && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleUndo(log)}
                                                className="h-8 w-8 p-0 rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900"
                                            >
                                                <Undo2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </CardContent>
    </Card>
  )
}
