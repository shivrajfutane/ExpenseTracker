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
import { Loader2, PlusCircle, Users } from 'lucide-react'
import { toast } from 'sonner'

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Create group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert([{ name: name.trim(), creator_id: user.id }])
        .select()
        .single()

      if (groupError) throw groupError

      // 2. Add creator as a member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{ 
          group_id: group.id, 
          user_id: user.id, 
          status: 'accepted'
        }])

      if (memberError) throw memberError

      toast.success('Group created successfully!')
      setName('')
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="h-11 shadow-md bg-zinc-900 border border-transparent hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 gap-2 font-medium">
            <PlusCircle className="h-4 w-4" />
            New Group
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a Travel/Split Group</DialogTitle>
          <DialogDescription>
            Give your group a name. You can invite friends to this group on the next screen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Group Name</Label>
            <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g., Summer Trip to Bali" 
                  className="pl-9"
                  required 
                  disabled={loading} 
                />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !name.trim()} className="w-full h-11">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
