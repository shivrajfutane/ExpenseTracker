'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save, User, Globe, Wallet } from 'lucide-react'
import { toast } from 'sonner'

export function SettingsForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState(initialData?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatar_url || '')
  const [bio, setBio] = useState(initialData?.bio || '')
  const [currency, setCurrency] = useState(initialData?.currency || '$')
  const [budget, setBudget] = useState(initialData?.monthly_budget?.toString() || '0')
  
  const supabase = createClient()
  const router = useRouter()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation
    if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
    }
    if (file.size > 2 * 1024 * 1024) {
        toast.error('File too large (max 2MB)')
        return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${Math.random()}.${fileExt}`

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 3. Update Profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      toast.success('Profile picture updated!')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Error uploading image')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          avatar_url: avatarUrl.trim(),
          bio: bio.trim(),
          currency,
          monthly_budget: parseFloat(budget) || 0
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Profile updated successfully!')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 relative group">
          <div className="relative h-24 w-24">
              <img 
                src={avatarUrl || `https://ui-avatars.com/api/?name=${fullName || 'User'}&background=random`} 
                alt="Profile" 
                className="h-24 w-24 rounded-full object-cover ring-2 ring-white dark:ring-zinc-900 shadow-xl" 
              />
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <Loader2 className={`h-6 w-6 text-white animate-spin ${loading ? 'block' : 'hidden'}`} />
                    <User className={`h-6 w-6 text-white ${loading ? 'hidden' : 'block'}`} />
                  </label>
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={loading}
              />
          </div>
          <div className="mt-4 text-center">
              <p className="text-sm font-medium">Profile Picture</p>
              <p className="text-xs text-zinc-500">Click to upload (JPG or PNG, max 2MB)</p>
          </div>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-2">
        {/* Personal Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
               <User className="h-5 w-5 text-zinc-500" />
               <h3 className="font-semibold text-lg">Personal Details</h3>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="fullName">Display Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              disabled={loading}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a bit about yourself"
              className="resize-none h-24"
              disabled={loading}
            />
          </div>
        </div>

        {/* Financial Preferences */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
               <Globe className="h-5 w-5 text-zinc-500" />
               <h3 className="font-semibold text-lg">Financial Preferences</h3>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="currency">Preferred Currency</Label>
            <Select 
                value={currency} 
                onValueChange={(val) => setCurrency(val || '$')}
                disabled={loading}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$">USD ($)</SelectItem>
                <SelectItem value="₹">INR (₹)</SelectItem>
                <SelectItem value="€">EUR (€)</SelectItem>
                <SelectItem value="£">GBP (£)</SelectItem>
                <SelectItem value="¥">JPY (¥)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="budget">Monthly Budget Limit</Label>
            <div className="relative">
                <Wallet className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                    id="budget"
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="0.00"
                    className="pl-9"
                    disabled={loading}
                />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
                We will use this to track your monthly spending progress.
            </p>
          </div>
        </div>
        <div className="md:col-span-2 flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button disabled={loading} type="submit" className="h-11 px-8 shadow-md">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
            </Button>
        </div>
      </form>
    </div>
  )
}
