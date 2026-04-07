'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { logActivity } from '@/lib/activity-logger'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { SplitExpenseDialog } from './SplitExpenseDialog'

export function SplitExpenseActions({ 
  expense, 
  groupId, 
  members, 
  canEdit 
}: { 
  expense: any, 
  groupId: string, 
  members: any[], 
  canEdit: boolean 
}) {
  const [deleting, setDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  if (!canEdit) return null

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Log Activity BEFORE Deleting (to avoid FK violation in log table)
      await logActivity({
          userId: user.id,
          action: 'expense_deleted',
          groupId,
          expenseId: expense.id,
          metadata: {
              before: { 
                  title: expense.title, 
                  amount: expense.total_amount,
                  splits: expense.splits 
              }
          }
      })

      // 2. Delete splits first
      const { error: splitError } = await supabase
        .from('expense_splits')
        .delete()
        .eq('split_expense_id', expense.id)
      
      if (splitError) throw splitError

      // 3. Delete the master record
      const { error: mainError } = await supabase
        .from('split_expenses')
        .delete()
        .eq('id', expense.id)
      
      if (mainError) throw mainError

      toast.success('Split expense deleted')
      setShowDelete(false)
      
      // Force a refresh of the page
      router.refresh()
      // Fallback for some server component caching issues
      setTimeout(() => window.location.reload(), 500)
    } catch (e: any) {
      console.error('Delete error:', e)
      toast.error(e.message || 'Failed to delete expense')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 border-none outline-none focus:ring-0 cursor-pointer -mr-2">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
             <DropdownMenuLabel>Actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setShowEdit(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Split
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SplitExpenseDialog 
        groupId={groupId} 
        members={members} 
        expense={expense} 
        open={showEdit} 
        onOpenChange={setShowEdit} 
      />

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="shadow-2xl border-zinc-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-red-600 mb-2">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Trash2 className="h-5 w-5" />
                </div>
                <AlertDialogTitle className="text-xl">Confirm Delete</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-zinc-500">
              This will permanently remove <strong>"{expense.title}"</strong> and all its associated splits. 
              Balances will be adjusted for all members immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl border-zinc-200 dark:border-zinc-800 font-bold" disabled={deleting}>Nevermind</AlertDialogCancel>
            <Button 
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold px-6 shadow-lg shadow-red-500/20"
            >
                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete Permanently'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
