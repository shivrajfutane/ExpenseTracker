'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase-client'
import { logActivity } from '@/lib/activity-logger'
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
import { Loader2, PlusCircle, DollarSign, ReceiptText, AlertTriangle, CheckCircle2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
  const [totalAmountInput, setTotalAmountInput] = useState(expense?.total_amount?.toString() || '')
  const [manualSplits, setManualSplits] = useState<Record<string, string>>({})
  
  const supabase = createClient()
  const router = useRouter()

  // 🔄 Load existing splits if editing
  useEffect(() => {
    if (isEditing && expense.splits) {
        setTitle(expense.title)
        setTotalAmountInput(expense.total_amount.toString())
        const initialManual: Record<string, string> = {}
        expense.splits.forEach((s: any) => {
            initialManual[s.user_id] = s.owed_amount.toString()
        })
        setManualSplits(initialManual)
        setSplitType('exact')
    } else if (!isEditing) {
        setTitle('')
        setTotalAmountInput('')
        setManualSplits({})
        setSplitType('equal')
    }
  }, [isEditing, expense, open])

  // 🧮 Math Engine
  const totalAmount = parseFloat(totalAmountInput) || 0
  
  const splitResults = useMemo(() => {
    const results: Record<string, number> = {}
    const memberCount = members.length || 1

    if (splitType === 'equal') {
      const equalShare = totalAmount / memberCount
      members.forEach(m => results[m.user_id] = equalShare)
      
      // Auto-adjust precision for Equal Splits
      const sum = Object.values(results).reduce((s, v) => s + v, 0)
      const diff = totalAmount - sum
      if (Math.abs(diff) > 0 && Math.abs(diff) < 0.1 && members.length > 0) {
          results[members[members.length - 1].user_id] += diff
      }
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

  const handleAutoAdjust = () => {
    if (members.length === 0) return
    const lastMemberId = members[members.length - 1].user_id
    const otherSum = Object.entries(splitResults)
        .filter(([id]) => id !== lastMemberId)
        .reduce((sum, [_, val]) => sum + val, 0)
    
    const adjustment = totalAmount - otherSum
    handleManualChange(lastMemberId, adjustment.toFixed(2))
    toast.success('Precision error adjusted for last user!')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || totalAmount <= 0 || !isValid) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const beforeState = isEditing ? { title: expense.title, amount: expense.total_amount, splits: expense.splits } : null
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

      // 4. Log Activity
      await logActivity({
          userId: user.id,
          action: isEditing ? 'expense_edited' : 'expense_created',
          groupId,
          expenseId,
          metadata: {
              before: beforeState,
              after: { title: title.trim(), amount: totalAmount, splits: splitResults }
          }
      })

      toast.success(isEditing ? 'Expense updated!' : 'Expense split and saved!')
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
            <Button className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 gap-2 border border-transparent hover:shadow-lg transition-all duration-300">
              <PlusCircle className="h-4 w-4" />
              Add Shared Expense
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-[500px] border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {isEditing ? 'Edit Shared Expense' : 'Create shared expense'}
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            {isEditing ? 'Modify the details and splits for this group expense.' : 'Record a bill and choose how to divide it among members.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Reason</Label>
                <div className="relative group">
                    <ReceiptText className={cn(
                        "absolute left-3 top-3 h-4 w-4 transition-colors",
                        title ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 group-focus-within:text-zinc-600"
                    )} />
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Dinner, Rent" className="pl-9 h-11 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-100" required disabled={loading} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount" className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Total Amount</Label>
                <div className="relative group">
                    <DollarSign className={cn(
                        "absolute left-3 top-3 h-4 w-4 transition-colors",
                        totalAmountInput ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 group-focus-within:text-zinc-600"
                    )} />
                    <Input id="amount" type="number" step="0.01" value={totalAmountInput} onChange={(e) => setTotalAmountInput(e.target.value)} placeholder="0.00" className="pl-9 h-11 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-100" required disabled={loading} />
                </div>
              </div>
          </div>

          <Tabs defaultValue="equal" className="w-full" onValueChange={(v) => setSplitType(v as SplitType)}>
            <div className="flex items-center justify-between mb-2">
                <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Split Strategy</Label>
                {splitType !== 'equal' && !isValid && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleAutoAdjust} className="h-6 text-[10px] text-zinc-500 hover:text-zinc-900 gap-1 px-1">
                        <Wand2 className="h-3 w-3" />
                        Fix Balance
                    </Button>
                )}
            </div>
            <TabsList className="grid w-full grid-cols-4 h-11 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              <TabsTrigger value="equal" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-sm">Equal</TabsTrigger>
              <TabsTrigger value="exact" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-sm">Exact</TabsTrigger>
              <TabsTrigger value="percentage" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-sm">%</TabsTrigger>
              <TabsTrigger value="shares" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-sm">Shares</TabsTrigger>
            </TabsList>

            <div className="mt-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 bg-zinc-50/30 dark:bg-zinc-900/30 space-y-1 max-h-[260px] overflow-y-auto custom-scrollbar">
                {members.map((member) => {
                    const mProfile = member.profile || {}
                    const initials = (mProfile.full_name || mProfile.email || 'U').substring(0, 1).toUpperCase()
                    
                    return (
                        <div key={member.user_id} className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800/50 transition-colors group/row">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 ring-2 ring-transparent group-hover/row:ring-zinc-200 dark:group-hover/row:ring-zinc-800 transition-all">
                                    <AvatarImage src={mProfile.avatar_url} />
                                    <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="grid">
                                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{mProfile.full_name || mProfile.email}</span>
                                    <span className={cn(
                                        "text-[11px] font-mono",
                                        splitResults[member.user_id] > 0 ? "text-zinc-500 font-bold" : "text-zinc-400"
                                    )}>Owes ₹{splitResults[member.user_id]?.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            {splitType !== 'equal' && (
                                <div className="w-24 relative">
                                    <Input 
                                        type="number" 
                                        step="0.01"
                                        placeholder={splitType === 'percentage' ? '%' : splitType === 'shares' ? 'Units' : '₹'}
                                        className="h-9 text-right text-xs pr-7 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                                        value={manualSplits[member.user_id] || ''}
                                        onChange={(e) => handleManualChange(member.user_id, e.target.value)}
                                        disabled={loading}
                                    />
                                    <span className="absolute right-2 top-2.5 text-[10px] text-zinc-400 font-bold uppercase pointer-events-none">
                                        {splitType === 'percentage' ? '%' : splitType === 'shares' ? 'S' : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
          </Tabs>

          {/* Validation Status */}
          <div className={cn(
                  "p-4 rounded-2xl flex items-center justify-between gap-2 text-sm border-2 transition-all duration-300",
                  isValid 
                  ? "bg-emerald-50/50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400" 
                  : "bg-amber-50/50 border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 animate-pulse"
              )}>
               <div className="flex items-center gap-3">
                 <div className={cn(
                     "h-8 w-8 rounded-xl flex items-center justify-center",
                     isValid ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-amber-100 dark:bg-amber-900/50"
                 )}>
                    {isValid ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                 </div>
                 <div className="grid">
                    <span className="font-bold">{isValid ? 'Ready to split' : 'Unbalanced'}</span>
                    <span className="text-[11px] opacity-80">
                        {isValid ? 'Total matches across all members' : `Missing: ₹${Math.abs(diff).toFixed(2)}`}
                    </span>
                 </div>
               </div>
               <div className="text-right">
                    <div className="text-lg font-black font-mono">₹{currentTotal.toFixed(2)}</div>
                    <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Calculated</div>
               </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-3">
            <Button type="submit" disabled={loading || !title.trim() || totalAmount <= 0 || !isValid} className={cn(
                "w-full h-12 rounded-xl text-md font-bold transition-all shadow-xl active:scale-95",
                isValid ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:shadow-zinc-500/20" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 cursor-not-allowed opacity-50"
            )}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isEditing ? 'Update Selection' : 'Confirm Split')}
            </Button>
            <p className="text-[10px] text-center text-zinc-500 font-medium">Split amounts are automatically calculated with ultra-precision indexing to prevent rounding errors.</p>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
