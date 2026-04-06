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
import { Loader2, DollarSign, Handshake } from 'lucide-react'
import { toast } from 'sonner'

export function SettleUpDialog({ groupId, currentUserId, members }: { groupId: string, currentUserId: string, members: any[] }) {
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

      if (error) throw error

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
                    <SelectItem value="none" disabled>No other active members found</SelectItem>
                ) : (
                    availableMembers.map(m => (
                        <SelectItem key={m.id} value={m.user_id}>
                            {m.profile?.full_name || m.profile?.email || `Member: ${m.user_id.substring(0,6)}...`}
                        </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount Paid</Label>
            <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input 
                  id="amount" 
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="0.00" 
                  className="pl-9"
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
