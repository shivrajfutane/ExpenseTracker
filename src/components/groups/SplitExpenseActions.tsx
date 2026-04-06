'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
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
      // 1. Delete splits first (or let CASCADE handle it, but let's be explicit)
      await supabase.from('expense_splits').delete().eq('split_expense_id', expense.id)
      // 2. Delete the master record
      const { error } = await supabase.from('split_expenses').delete().eq('id', expense.id)
      
      if (error) throw error
      toast.success('Split expense deleted')
      setShowDelete(false)
      router.refresh()
    } catch (e: any) {
      toast.error('Failed to delete expense')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div onClick={(e) => e.preventDefault()}>
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
            variant="destructive"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="h-5 w-5" />
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the expense and automatically remove its exact splits from everyone's balance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
            >
                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
