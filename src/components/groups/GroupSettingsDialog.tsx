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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Settings, UserMinus, Trash2, Save, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

interface GroupSettingsDialogProps {
  group: any;
  members: any[];
  isCreator: boolean;
}

export function GroupSettingsDialog({ group, members, isCreator }: GroupSettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(group.name)
  
  const supabase = createClient()
  const router = useRouter()

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || name === group.name) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('groups')
        .update({ name: name.trim() })
        .eq('id', group.id)

      if (error) throw error
      toast.success('Group renamed Successfully!')
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to rename group')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', userId)

      if (error) throw error
      toast.success('Member removed')
      router.refresh()
    } catch (error: any) {
      toast.error('Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGroup = async () => {
    setLoading(true)
    try {
      // Manual cleanup (in case cascade isn't set)
      await supabase.from('split_expenses').delete().eq('group_id', group.id)
      await supabase.from('group_members').delete().eq('group_id', group.id)
      
      const { data: splitIds } = await supabase.from('split_expenses').select('id').eq('group_id', group.id)
      if (splitIds && splitIds.length > 0) {
        await supabase.from('expense_splits').delete().in('split_expense_id', splitIds.map((d: { id: string }) => d.id))
      }
      await supabase.from('split_expenses').delete().eq('group_id', group.id)
      await supabase.from('group_members').delete().eq('group_id', group.id)
      
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', group.id)

      if (error) throw error
      toast.success('Group deleted permanently')
      router.push('/dashboard/groups')
    } catch (error: any) {
      toast.error('Failed to delete group')
    } finally {
      setLoading(false)
    }
  }

  if (!isCreator) return null

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Group Settings</DialogTitle>
            <DialogDescription>
              Manage your group details and members list.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 pt-4">
              <form onSubmit={handleRename} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="e.g., Summer Trip" 
                    disabled={loading} 
                  />
                </div>
                <Button type="submit" disabled={loading || !name.trim() || name === group.name} className="w-full gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </form>

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h4>
                <p className="text-xs text-zinc-500 mb-4">
                  Once you delete a group, there is no going back. Please be certain.
                </p>
                <Button 
                   variant="destructive" 
                   className="w-full gap-2" 
                   onClick={() => setShowDelete(true)}
                   disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Group
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="members" className="pt-4">
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {members.map((member) => {
                  const mProfile = member.profile || {}
                  const isUserCreator = member.user_id === group.creator_id
                  const initials = (mProfile.full_name || mProfile.email || 'U').substring(0, 1).toUpperCase()
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between gap-4 p-2 rounded-lg border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={mProfile.avatar_url} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="grid">
                          <span className="text-sm font-medium leading-none">
                            {mProfile.full_name || 'Anonymous User'}
                            {isUserCreator && <span className="ml-2 text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">Creator</span>}
                          </span>
                          <span className="text-xs text-zinc-500">{mProfile.email}</span>
                        </div>
                      </div>
                      
                      {!isUserCreator && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => handleRemoveMember(member.user_id)}
                          disabled={loading}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-red-600">
               <ShieldAlert className="h-6 w-6" />
               <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the group **"{group.name}"** and all associated expenses and splits for everyone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteGroup}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Yes, Delete Group'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
