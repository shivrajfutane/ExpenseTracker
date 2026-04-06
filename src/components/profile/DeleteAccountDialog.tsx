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
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSeparator, 
  InputOTPSlot 
} from "@/components/ui/input-otp"
import { Loader2, Trash2, ShieldAlert, MailCheck, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteAccountDialog({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'init' | 'otp'>('init')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const supabase = createClient()
  const router = useRouter()

  const handleRequestOTP = async () => {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Important: We are only re-authenticating
        }
      })
      if (error) throw error
      toast.success('Validation code sent to your email')
      setStep('otp')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndDelete = async () => {
    if (!otp || otp.length !== 6) return

    setLoading(true)
    setError('')
    try {
      // 1. Verify the OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      })
      if (verifyError) throw verifyError

      // 2. Call the RPC to delete the account
      // This function must be created in Supabase (SECURITY DEFINER)
      const { error: deleteError } = await supabase.rpc('delete_self')
      if (deleteError) throw deleteError

      toast.success('Account deleted successfully. Sorry to see you go!')
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Invalid code or deletion failed')
      toast.error(err.message || 'Deletion failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
        setOpen(val)
        if (!val) setStep('init') // Reset step when closed
    }}>
      <DialogTrigger
        render={
          <Button variant="destructive" className="w-full sm:w-auto h-11 px-8 shadow-sm gap-2">
            <Trash2 className="h-4 w-4" />
            Delete Account
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3 text-red-600 mb-2">
             <div className="p-2 bg-red-100 dark:bg-red-950/40 rounded-full">
                <ShieldAlert className="h-6 w-6" />
             </div>
             <div>
                <DialogTitle className="text-xl">Verify Deletion</DialogTitle>
                <DialogDescription className="text-red-600/70 dark:text-red-400/70 font-medium">
                    This action is final and irreversible.
                </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 'init' ? (
            <div className="space-y-6">
                <div className="space-y-3">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        To protect your account, we require a magic code verification. By proceeding, the following will happen:
                    </p>
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            All shared expenses and groups will be archived.
                        </li>
                        <li className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Your profile and bio will be permanently purged.
                        </li>
                        <li className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Active session and login access will be revoked.
                        </li>
                    </ul>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700">
                        <MailCheck className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{email}</p>
                        <p className="text-[10px] text-zinc-500">We'll send the 6-digit code here</p>
                    </div>
                </div>

                <Button 
                   onClick={handleRequestOTP} 
                   disabled={loading} 
                   className="w-full h-12 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 transition-all font-semibold"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Request Verification Code'}
                </Button>
            </div>
          ) : (
            <div className="space-y-8 flex flex-col items-center">
                <div className="w-full text-center space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="otp" className="text-sm font-bold tracking-tight">Security Verification</Label>
                        <p className="text-[11px] text-zinc-500">Enter the 6-digit code sent to your email</p>
                    </div>
                    
                    <div className="flex justify-center py-2">
                        <InputOTP 
                          maxLength={6} 
                          value={otp} 
                          onChange={setOtp}
                          className="flex items-center gap-3"
                        >
                          <InputOTPGroup className="gap-2">
                            <InputOTPSlot index={0} className="rounded-xl border-2 h-12 w-10 text-lg font-bold" />
                            <InputOTPSlot index={1} className="rounded-xl border-2 h-12 w-10 text-lg font-bold" />
                            <InputOTPSlot index={2} className="rounded-xl border-2 h-12 w-10 text-lg font-bold" />
                          </InputOTPGroup>
                          <InputOTPSeparator />
                          <InputOTPGroup className="gap-2">
                            <InputOTPSlot index={3} className="rounded-xl border-2 h-12 w-10 text-lg font-bold" />
                            <InputOTPSlot index={4} className="rounded-xl border-2 h-12 w-10 text-lg font-bold" />
                            <InputOTPSlot index={5} className="rounded-xl border-2 h-12 w-10 text-lg font-bold" />
                          </InputOTPGroup>
                        </InputOTP>
                    </div>

                    {error && (
                        <div className="flex items-center justify-center gap-2 text-red-500 bg-red-50 dark:bg-red-950/30 py-2 rounded-lg animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-[11px] font-bold uppercase tracking-wider">{error}</span>
                        </div>
                    )}
                    
                    <div className="pt-2">
                        <button 
                            onClick={() => setStep('init')} 
                            className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center justify-center gap-1 mx-auto transition-colors"
                        >
                            Didn't receive a code? <span className="underline">Go back and retry</span>
                        </button>
                    </div>
                </div>
                
                <Button 
                   onClick={handleVerifyAndDelete} 
                   disabled={loading || otp.length !== 6} 
                   className="w-full h-12 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-xl font-bold transition-all"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Permanent Deletion'}
                </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
