'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function JoinGroupClient({ groupId }: { groupId: string }) {
   const [loading, setLoading] = useState(false)
   const supabase = createClient()
   const router = useRouter()

   const handleJoin = async () => {
       setLoading(true)
       try {
           const { data: { user }} = await supabase.auth.getUser()
           if (!user) throw new Error("You must be logged in to join.")

           const { error } = await supabase.from('group_members').insert([{
               group_id: groupId,
               user_id: user.id,
               status: 'accepted'
           }])

           // Error 23505 is Unique Violation (They are already in the group!)
           if (error && error.code !== '23505') throw error

           toast.success("Successfully joined the group!")
           router.push(`/dashboard/groups/${groupId}`)
           router.refresh()
       } catch (e: any) {
           toast.error(e.message || "Failed to join group. You might not have permission.")
       } finally {
           setLoading(false)
       }
   }

   return (
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto animate-in fade-in zoom-in duration-500">
            <div className="relative mb-8">
                <img src="/logo.png" alt="Logo" className="relative h-20 w-20 rounded-2xl object-cover shadow-xl bg-zinc-900 ring-4 ring-white dark:ring-zinc-950 mx-auto" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-3">
                You've been invited!
            </h2>
           <p className="text-zinc-500 mb-8 px-4">
                Someone sent you a secure invite link to join their shared expense group.
           </p>
           <Button onClick={handleJoin} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600">
               {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Accept Invite'}
           </Button>
       </div>
   )
}
