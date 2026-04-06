'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UserNav } from './UserNav'
import { ThemeToggle } from './ThemeToggle'
import { PieChart, History, PlusCircle, LayoutDashboard, WalletCards, Users } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'History', href: '/dashboard/history', icon: History },
  { name: 'Groups', href: '/dashboard/groups', icon: Users },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <div className="border-b bg-white dark:bg-zinc-950 sticky top-0 z-50">
      <div className="container flex h-16 items-center px-4 md:px-8 mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2 mr-8 hover:opacity-80 transition-opacity">
          <img src="/logo.svg" alt="Logo" className="h-8 w-8 rounded-lg object-cover shadow-sm dark:invert" />
          <span className="font-bold text-lg tracking-tight hidden sm:inline-block bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent dark:from-zinc-100 dark:to-zinc-400">
            ExpenseTracker
          </span>
        </Link>
        
        <nav className="flex items-center space-x-4 lg:space-x-6 flex-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
                pathname === item.href 
                  ? "text-zinc-900 dark:text-zinc-100" 
                  : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </div>
  )
}
