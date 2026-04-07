'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { 
  ArrowRight, 
  Users, 
  LineChart, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  PieChart, 
  LayoutDashboard 
} from 'lucide-react'
import Link from 'next/link'
export function LandingPage({ session }: { session: any }) {
  // Entrance animations for sections
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "circOut" } as any
  }

  const features = [
    {
      title: "Split with Precision",
      desc: "Equal, exact, or shares. Handle any splitting scenario with real-time validation.",
      icon: Users,
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      title: "Advanced Analytics",
      desc: "Visualize your spending patterns with beautiful, interactive charts and insights.",
      icon: LineChart,
      color: "bg-purple-500/10 text-purple-600"
    },
    {
      title: "Secure Isolation",
      desc: "Your data is protected with enterprise-grade security and personal isolation.",
      icon: ShieldCheck,
      color: "bg-emerald-500/10 text-emerald-600"
    },
    {
      title: "Settlements Reimagined",
      desc: "Debt simplification algorithm to minimize the number of transactions needed.",
      icon: Zap,
      color: "bg-amber-500/10 text-amber-600"
    }
  ]

  return (
    <div className="relative min-h-screen bg-white dark:bg-zinc-950 overflow-hidden font-sans selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900">
      
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
             animate={{ 
                 scale: [1, 1.2, 1],
                 opacity: [0.1, 0.15, 0.1] 
             }}
             transition={{ duration: 10, repeat: Infinity }}
             className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-zinc-200 dark:bg-zinc-800 rounded-full blur-[120px]"
          />
          <motion.div 
             animate={{ 
                 scale: [1.2, 1, 1.2],
                 opacity: [0.05, 0.1, 0.05] 
             }}
             transition={{ duration: 15, repeat: Infinity }}
             className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-zinc-100 dark:bg-zinc-900 rounded-full blur-[100px]"
          />
      </div>

      {/* Navbar Section */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-100/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl">
        <div className="container px-6 h-18 flex items-center justify-between mx-auto">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="h-9 w-9 dark:invert" />
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">ExpenseTracker</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {session ? (
              <Link href="/dashboard">
                <Button variant="outline" className="rounded-full px-6 flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="rounded-full text-sm font-medium">Log in</Button>
                </Link>
                <Link href="/login">
                  <Button className="rounded-full px-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity">
                    Enroll Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 md:pt-48 md:pb-32 container px-6 mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
            >
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Intelligent Ledger v2.0 Released</span>
            </motion.div>

            <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                className="text-5xl md:text-8xl font-black tracking-tight leading-[1.05] bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-transparent dark:from-zinc-100 dark:to-zinc-500"
            >
                Financial freedom, <br />
                <span className="italic font-serif font-light">simplified.</span>
            </motion.h1>

            <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="text-lg md:text-xl text-zinc-500/80 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed"
            >
                The premium expense tracker built for individuals and teams who value precision, security, and absolute clarity.
            </motion.p>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6"
            >
                <Link href={session ? "/dashboard" : "/login"}>
                    <Button className="h-14 px-10 rounded-full text-lg font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xl hover:scale-105 transition-transform group">
                        Get Started
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
                <div className="flex -space-x-3 items-center">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="h-10 w-10 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-200 dark:bg-zinc-800 overflow-hidden ring-1 ring-zinc-100 dark:ring-zinc-900">
                             <img src={`https://i.pravatar.cc/100?u=${i}`} alt="Avatar" className="h-full w-full object-cover" />
                        </div>
                    ))}
                    <span className="ml-4 text-sm font-bold text-zinc-500">Join 10k+ savers</span>
                </div>
            </motion.div>
        </div>

        {/* Feature Visual Preview */}
        <motion.div 
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: "circOut" }}
            className="mt-20 md:mt-32 relative mx-auto max-w-5xl"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-500/10 blur-[80px]" />
            <Card className="relative border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.05)] dark:shadow-[0_0_80px_rgba(0,0,0,0.3)] overflow-hidden rounded-[2rem] border-8">
                <CardContent className="p-0">
                    <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-6 gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-400" />
                        <div className="h-3 w-3 rounded-full bg-yellow-400" />
                        <div className="h-3 w-3 rounded-full bg-green-400" />
                        <div className="ml-4 h-5 w-48 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                    </div>
                    <div className="p-8 grid md:grid-cols-12 gap-8">
                        <div className="md:col-span-4 space-y-6">
                            <div className="h-32 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-end">
                                <p className="text-3xl font-black">₹12,450</p>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">April Balance</p>
                            </div>
                            <div className="space-y-3">
                                {[1,2,3].map(i => (
                                    <div key={i} className="h-12 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center px-4 justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-7 w-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                                                <PieChart className="h-3.5 w-3.5 text-zinc-500" />
                                            </div>
                                            <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                                        </div>
                                        <div className="h-3 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-8 bg-zinc-50 dark:bg-zinc-950/50 rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 min-h-[300px] p-8 relative overflow-hidden">
                             <div className="flex items-center justify-between mb-8">
                                <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                                <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                             </div>
                             <div className="grid grid-cols-4 gap-4 items-end h-[200px] pt-10">
                                {[60, 100, 80, 120].map((h, i) => (
                                    <motion.div 
                                        key={i} 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ duration: 1.5, delay: 1 + (i * 0.1), ease: "circOut" }}
                                        className="bg-zinc-900 dark:bg-zinc-100 rounded-t-xl opacity-80" 
                                    />
                                ))}
                             </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
      </main>

      {/* Features Grid */}
      <section className="py-32 container px-6 mx-auto">
        <motion.div 
            {...fadeIn as any}
            className="text-center space-y-4 mb-20"
        >
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">Built for precision.</h2>
            <p className="text-zinc-500 max-w-xl mx-auto font-medium">Everything you need to master your financial destiny, packaged in a sleek, minimalist interface.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
                <motion.div
                    key={idx}
                    {...fadeIn as any}
                    transition={{ delay: idx * 0.1, duration: 0.8 }}
                    whileHover={{ y: -10 }}
                >
                    <Card className="h-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 group hover:shadow-2xl hover:shadow-zinc-500/10 dark:hover:shadow-black/50 transition-all rounded-[1.5rem]">
                        <CardContent className="p-8 space-y-6">
                            <div className={`h-14 w-14 rounded-2xl ${feature.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
                                <feature.icon className="h-7 w-7" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold">{feature.title}</h3>
                                <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                                    {feature.desc}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="py-20 bg-zinc-50 dark:bg-zinc-900/50 border-y border-zinc-100 dark:border-zinc-800 relative">
          <div className="container px-6 mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
                {[
                    { val: "10k+", label: "Active Savers" },
                    { val: "₹50Cr+", label: "Expenses Tracked" },
                    { val: "4.9/5", label: "App Rating" },
                    { val: "99.9%", label: "Uptime" }
                ].map((stat, i) => (
                    <motion.div key={i} {...fadeIn as any} className="text-center space-y-1">
                        <p className="text-4xl font-black tracking-tighter">{stat.val}</p>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                    </motion.div>
                ))}
          </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 container px-6 mx-auto text-center">
            <motion.div {...fadeIn as any} className="max-w-3xl mx-auto space-y-10 p-12 md:p-20 rounded-[3rem] bg-gradient-to-b from-zinc-900 to-zinc-800 text-white dark:from-zinc-100 dark:to-zinc-200 dark:text-zinc-900 shadow-3xl">
                <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">Master your money. <br/> From today.</h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/login">
                        <Button className="h-14 px-10 rounded-full text-lg font-bold bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 hover:scale-105 transition-transform">
                            Start Tracking Now
                        </Button>
                    </Link>
                </div>
                <div className="flex items-center justify-center gap-6 pt-4 text-white/50 dark:text-black/50">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                        <CheckCircle2 className="h-4 w-4" /> No card required
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                        <CheckCircle2 className="h-4 w-4" /> Secure isolation
                    </div>
                </div>
            </motion.div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 border-t border-zinc-100 dark:border-zinc-800 container px-6 mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-zinc-500">
            <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="Logo" className="h-6 w-6 dark:invert opacity-50" />
                <span className="text-sm font-bold tracking-tight">ExpenseTracker © 2026</span>
            </div>
            <div className="flex gap-8 text-xs font-bold uppercase tracking-widest">
                <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100">Privacy</a>
                <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100">Terms</a>
                <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100">Contact</a>
            </div>
      </footer>
    </div>
  )
}
