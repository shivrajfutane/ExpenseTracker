'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, PlusCircle, DollarSign, ReceiptText, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares'

interface SplitExpenseDialogProps {
    groupId: string;
    members: any[];
    expense?: any; // For editing
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function SplitExpenseDialog({ groupId, members, expense, open: externalOpen, onOpenChange: onExternalOpenChange }: SplitExpenseDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onExternalOpenChange || setInternalOpen

  const [loading, setLoading] = useState(false)
  const isEditing = !!expense

  // 📈 Mode State
  const [splitType, setSplitType] = useState<SplitType>('equal')
  
  // 📝 Form State
  const [title, setTitle] = useState(expense?.title || '')
  const [amount, setAmount] = useState(expense?.total_amount?.toString() || '')
  const [manualSplits, setManualSplits] = useState<Record<string, string>>({})
  
  const supabase = createClient()
  const router = useRouter()

  // 🔄 Load existing splits if editing
  useEffect(() => {
    if (isEditing && expense.splits) {
        const initialManual: Record<string, string> = {}
        expense.splits.forEach((s: any) => {
            // For editing, let's default to "Exact" representation for simplicity 
            // unless we store the type (but we don't yet).
            initialManual[s.user_id] = s.owed_amount.toString()
        })
        setManualSplits(initialManual)
        setSplitType('exact')
    }
  }, [isEditing, expense])

  // 🧮 Math Engine
  const totalAmount = parseFloat(amount) || 0
  
  const splitResults = useMemo(() => {
    const results: Record<string, number> = {}
    const memberCount = members.length || 1

    if (splitType === 'equal') {
      const equalShare = totalAmount / memberCount
      members.forEach(m => results[m.user_id] = equalShare)
    } 
    else if (splitType === 'exact') {
      members.forEach(m => results[m.user_id] = parseFloat(manualSplits[m.user_id]) || 0)
    } 
    else if (splitType === 'percentage') {
      members.forEach(m => {
        const perc = parseFloat(manualSplits[m.user_id]) || 0
        results[m.user_id] = (perc / 100) * totalAmount
      })
    } 
    else if (splitType === 'shares') {
      let totalShares = 0
      members.forEach(m => totalShares += parseFloat(manualSplits[m.user_id]) || 0)
      
      members.forEach(m => {
        const memberShares = parseFloat(manualSplits[m.user_id]) || 0
        results[m.user_id] = totalShares > 0 ? (memberShares / totalShares) * totalAmount : 0
      })
    }

    return results
  }, [splitType, totalAmount, manualSplits, members])

  const currentTotal = Object.values(splitResults).reduce((sum, val) => sum + val, 0)
  const diff = totalAmount - currentTotal
  const isValid = totalAmount > 0 && Math.abs(diff) < 0.01

  const handleManualChange = (userId: string, val: string) => {
    setManualSplits(prev => ({ ...prev, [userId]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || totalAmount <= 0 || !isValid) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let expenseId = expense?.id

      // 1. Handle the master split_expense record
      if (isEditing) {
        const { error } = await supabase
          .from('split_expenses')
          .update({ title: title.trim(), total_amount: totalAmount })
          .eq('id', expenseId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('split_expenses')
          .insert([{ 
              group_id: groupId, 
              title: title.trim(),
              total_amount: totalAmount,
              paid_by: user.id,
              created_by: user.id
          }])
          .select().single()
        if (error) throw error
        expenseId = data.id
      }

      // 2. Clear old splits if editing
      if (isEditing) {
        await supabase.from('expense_splits').delete().eq('split_expense_id', expenseId)
      }

      // 3. Upsert new splits
      const splitsToInsert = Object.entries(splitResults).map(([userId, owed]) => ({
          split_expense_id: expenseId,
          user_id: userId,
          owed_amount: owed
      }))

      const { error: splitError } = await supabase
        .from('expense_splits')
        .insert(splitsToInsert)

      if (splitError) throw splitError

      toast.success(isEditing ? 'Expense updated!' : 'Expense split and saved!')
      setTitle('')
      setAmount('')
      setManualSplits({})
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to process expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditing && (
        <DialogTrigger
          render={
            <Button className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Expense
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Expense' : 'Add a Shared Expense'}</DialogTitle>
          <DialogDescription>
            Divide the costs across your group using flexible split modes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Reason</Label>
                <div className="relative">
                    <ReceiptText className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Rent, Dinner..." className="pl-9" required disabled={loading} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Total Total</Label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="pl-9" required disabled={loading} />
                </div>
              </div>
          </div>

          <Tabs defaultValue="equal" className="w-full" onValueChange={(v) => setSplitType(v as SplitType)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="equal">Equal</TabsTrigger>
              <TabsTrigger value="exact">Exact</TabsTrigger>
              <TabsTrigger value="percentage">%</TabsTrigger>
              <TabsTrigger value="shares">Shares</TabsTrigger>
            </TabsList>

            <div className="mt-4 border rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-4 max-h-[300px] overflow-y-auto">
                {members.map((member) => {
                    const mProfile = member.profile || {}
                    const initials = (mProfile.full_name || mProfile.email || 'U').substring(0, 1).toUpperCase()
                    
                    return (
                        <div key={member.user_id} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 text-[10px]">
                                    <AvatarImage src={mProfile.avatar_url} />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                                <div className="grid">
                                    <span className="text-sm font-medium leading-none">{mProfile.full_name}</span>
                                    <span className="text-xs text-zinc-500 font-mono">Owes: ₹{splitResults[member.user_id]?.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            {splitType !== 'equal' && (
                                <div className="w-24">
                                    <Input 
                                        type="number" 
                                        step="0.01"
                                        placeholder={splitType === 'percentage' ? '%' : splitType === 'shares' ? 'Shares' : '₹'}
                                        className="h-8 text-right text-xs"
                                        value={manualSplits[member.user_id] || ''}
                                        onChange={(e) => handleManualChange(member.user_id, e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
          </Tabs>

          {/* Validation Status */}
          <div className={`p-3 rounded-lg flex items-center justify-between gap-2 text-sm border ${isValid ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
               <div className="flex items-center gap-2">
                 {isValid ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                 <span>{isValid ? 'Total Split Matches' : `Mismatch: ₹${Math.abs(diff).toFixed(2)} ${diff > 0 ? 'remaining' : 'over'}`}</span>
               </div>
               <span className="font-bold">₹{currentTotal.toFixed(2)}</span>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading || !title.trim() || totalAmount <= 0 || !isValid} className="w-full h-11 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? 'Update Split' : 'Complete Split')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
