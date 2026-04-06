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
import { Loader2, Mail, Users, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export function InviteMembersDialog({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const supabase = createClient()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [shareLink, setShareLink] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareLink(`${window.location.origin}/dashboard/groups/join/${groupId}`)
    }
  }, [groupId])

  const handleCopy = () => {
    if (!shareLink) return
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('group_invites')
        .insert([{ 
            group_id: groupId, 
            email: email.trim().toLowerCase(),
            invited_by: user.id
        }])

      if (error) {
          if (error.code === '23505') {
              throw new Error('This person is already invited.')
          }
          throw error
      }

      toast.success(`Invite recorded for ${email}!`)
      setEmail('')
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="gap-2 shrink-0">
            <Users className="h-4 w-4" />
            Invite Friends
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Friends</DialogTitle>
          <DialogDescription>
            Enter a friend's email address. When they create an account with this email, they'll see your group!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Friend's Email Address</Label>
            <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input 
                  id="email" 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="friend@example.com" 
                  className="pl-9"
                  required 
                  disabled={loading} 
                />
            </div>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            <span className="flex-shrink-0 mx-4 text-zinc-400 text-xs text-muted-foreground uppercase">or</span>
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
          </div>

          <div className="grid gap-2">
            <Label>Share Invite Link</Label>
            <div className="flex items-center gap-2">
                <Input 
                    readOnly 
                    value={shareLink} 
                    className="flex-1 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 font-mono text-xs" 
                />
                <Button type="button" variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !email.trim()} className="w-full h-11">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
