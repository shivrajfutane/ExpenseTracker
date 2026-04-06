'use client'

import { useState, useEffect } from 'react'
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
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from "date-fns"
import { CalendarIcon, Loader2, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Category, Expense } from '@/lib/types'

interface ExpenseDialogProps {
  userId: string;
  expense?: Expense;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ExpenseDialog({ userId, expense, open: externalOpen, onOpenChange: onExternalOpenChange }: ExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!expense
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [date, setDate] = useState<Date>(expense ? new Date(expense.date) : new Date())
  const supabase = createClient()
  const router = useRouter()

  // Form State
  const [title, setTitle] = useState(expense?.title || '')
  const [amount, setAmount] = useState(expense?.amount?.toString() || '')
  const [categoryId, setCategoryId] = useState(expense?.category_id || '')
  const [notes, setNotes] = useState(expense?.notes || '')
  const [currency, setCurrency] = useState('$')

  useEffect(() => {
    const fetchUserData = async () => {
      // 1. Fetch Categories
      const { data: catData } = await supabase.from('categories').select('*').eq('user_id', userId)
      if (catData && catData.length > 0) {
        setCategories(catData)
      } else if (userId) {
        // Seed default categories
        const defaultCategories = [
          { name: 'Food & Dining', color: '#f87171', user_id: userId },
          { name: 'Shopping', color: '#60a5fa', user_id: userId },
          { name: 'Transport', color: '#fbbf24', user_id: userId },
          { name: 'Entertainment', color: '#c084fc', user_id: userId },
          { name: 'Bills & Utilities', color: '#34d399', user_id: userId }
        ]
        const { data: inserted } = await supabase.from('categories').insert(defaultCategories).select()
        if (inserted) setCategories(inserted)
      }

      // 2. Fetch Profile for Currency
      const { data: profile } = await supabase.from('profiles').select('currency').eq('id', userId).single()
      if (profile?.currency) {
        setCurrency(profile.currency)
      }
    }
    if (userId) fetchUserData()
  }, [userId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount || !categoryId || !date) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    const expenseData = {
      title,
      amount: parseFloat(amount),
      category_id: categoryId,
      date: format(date, 'yyyy-MM-dd'),
      notes,
      user_id: userId,
    }

    try {
      let error;
      if (isEditing) {
        ({ error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', expense.id))
      } else {
        ({ error } = await supabase
          .from('expenses')
          .insert([expenseData]))
      }

      if (error) throw error

      toast.success(`Expense ${isEditing ? 'updated' : 'added'} successfully!`)
      
      // Reset form if not editing
      if (!isEditing) {
        setTitle('')
        setAmount('')
        setCategoryId('')
        setNotes('')
        setDate(new Date())
      }
      
      if (onExternalOpenChange) {
        onExternalOpenChange(false)
      } else {
        setOpen(false)
      }
      
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const dialogOpen = externalOpen !== undefined ? externalOpen : open
  const setDialogOpen = onExternalOpenChange || setOpen

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {!onExternalOpenChange && (
        <DialogTrigger
          render={
            <Button className="h-11 shadow-md bg-zinc-900 border border-transparent hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 gap-2 font-medium">
              <PlusCircle className="h-4 w-4" />
              Add Expense
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for your past expense.' : 'Record a new spending entry here.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Grocery Shopping" required disabled={loading} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount ({currency})</Label>
              <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required disabled={loading} />
            </div>
            <div className="grid gap-2">
                <Label>Date</Label>
                <Popover>
                    <PopoverTrigger>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                        )}
                        disabled={loading}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => d && setDate(d)}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={(val) => setCategoryId(val || '')} disabled={loading}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category">
                  {categoryId && categories.find((c) => c.id === categoryId) ? (
                    <>
                        <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categories.find(c => c.id === categoryId)?.color }}></span>
                        <span className="truncate">{categories.find(c => c.id === categoryId)?.name}</span>
                    </>
                  ) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                    <div className="p-2 text-xs text-zinc-500 text-center italic">No categories found</div>
                ) : (
                    categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                            <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                            <span className="truncate">{cat.name}</span>
                        </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Extra details..." disabled={loading} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? 'Update Expense' : 'Save Expense')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
