import { Navbar } from '@/components/layout/Navbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950/50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 md:px-8 max-w-7xl">
        {children}
      </main>
    </div>
  )
}
