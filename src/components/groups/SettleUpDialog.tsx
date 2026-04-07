'use client'

import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, DollarSign, Handshake, Info, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { logActivity } from '@/lib/activity-logger'

interface SettleUpDialogProps {
  groupId: string;
  currentUserId: string;
  members: any[];
  balances: Record<string, number>;
  currency: string;
}

export function SettleUpDialog({ groupId, currentUserId, members, balances, currency }: SettleUpDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [paidTo, setPaidTo] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const availableMembers = members.filter(m => m.user_id !== currentUserId && m.user_id !== null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !paidTo) return

    setLoading(true)
    try {
      const settleAmount = parseFloat(amount)
      if (isNaN(settleAmount) || settleAmount <= 0) {
          throw new Error('Please enter a valid amount')
      }

      const { error } = await supabase
        .from('settlements')
        .insert([{ 
            group_id: groupId, 
            paid_by: currentUserId,
            paid_to: paidTo,
            amount: settleAmount
        }])
        .select().single()

      if (error) throw error

      // Log the settlement
      await logActivity({
          userId: currentUserId,
          action: 'settlement_added',
          groupId,
          metadata: {
              amount: settleAmount,
              paid_to: paidTo,
              paid_by: currentUserId
          }
      })

      toast.success('Payment recorded successfully!')
      setAmount('')
      setPaidTo('')
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="gap-2 shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-900/30">
            <Handshake className="h-4 w-4" />
            Settle Debt
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settle Debts</DialogTitle>
          <DialogDescription>
            Record a payment to a group member to clear your balance out.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="member">Who did you pay?</Label>
            <Select onValueChange={(val) => setPaidTo(val || '')} value={paidTo} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a friend" />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.length === 0 ? (
                    <SelectItem value="none" disabled>No other members to pay</SelectItem>
                ) : (
                    availableMembers.map(m => {
                        const name = m.profile?.full_name || m.profile?.email || 'Unknown Member'
                        const email = m.profile?.email ? ` (${m.profile.email})` : ''
                        return (
                            <SelectItem key={m.user_id} value={m.user_id}>
                                {name}{name !== m.profile?.email ? email : ''}
                            </SelectItem>
                        )
                    })
                )}
              </SelectContent>
            </Select>
          </div>
          {paidTo && balances[paidTo] !== undefined && (
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm">
                        {balances[paidTo] < 0 
                            ? `You owe them ${currency}${Math.abs(balances[paidTo]).toFixed(2)}` 
                            : `They owe you ${currency}${balances[paidTo].toFixed(2)}`}
                    </span>
                </div>
                {balances[paidTo] < 0 && (
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400"
                        onClick={() => setAmount(Math.abs(balances[paidTo]).toFixed(2))}
                    >
                        Settle All
                    </Button>
                )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="amount">Amount Paid</Label>
            <div className="relative">
                <span className="absolute left-3 top-3 text-zinc-500 font-bold">{currency}</span>
                <Input 
                  id="amount" 
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="0.00" 
                  className="pl-8"
                  required 
                  disabled={loading} 
                />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !amount || !paidTo} className="w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
