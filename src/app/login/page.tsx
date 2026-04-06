'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { Globe, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const supabase = createClient()
  const router = useRouter()

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || 'Error signing in with Google')
      setLoading(false)
    }
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      })
      if (error) throw error
      toast.success('Check your email for the code!')
      setStep('otp')
    } catch (error: any) {
      toast.error(error.message || 'Error sending OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      })
      if (error) throw error
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-lg border-zinc-200 dark:border-zinc-800 bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50">
        <CardHeader className="space-y-4 pt-8">
          <div className="flex justify-center">
            <img src="/logo.svg" alt="Logo" className="h-14 w-14 rounded-2xl object-cover shadow-md dark:invert" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center">
            Log in to your expense tracker
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4">
            <Button 
              variant="outline" 
              onClick={handleGoogleLogin} 
              disabled={loading}
              className="w-full h-11 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
              Continue with Google
            </Button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500">
                Or continue with email
              </span>
            </div>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11"
                    disabled={loading}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading || !email}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Magic Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="grid gap-6">
              <div className="grid gap-4 place-items-center">
                <Label htmlFor="otp">Enter validation code</Label>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <p className="text-xs text-zinc-500 text-center">
                  Sent to <span className="font-medium text-zinc-900 dark:text-zinc-100">{email}</span>
                </p>
              </div>
              <div className="grid gap-2">
                <Button type="submit" className="w-full h-11" disabled={loading || otp.length !== 6}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify Code'}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setStep('email')} 
                  disabled={loading}
                  className="w-full h-10 text-zinc-500"
                >
                  Change email
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-center gap-1 text-sm text-zinc-500">
          <p>By continuing, you agree to our</p>
          <button className="underline hover:text-zinc-900 dark:hover:text-zinc-100">Terms</button>
          <p>and</p>
          <button className="underline hover:text-zinc-900 dark:hover:text-zinc-100">Privacy Policy</button>
        </CardFooter>
      </Card>
    </div>
  )
}
