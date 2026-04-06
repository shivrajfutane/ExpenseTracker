import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Overview } from '../../components/dashboard/Overview'
import { CategoryChart } from '../../components/dashboard/CategoryChart'
import { ExpenseDialog } from '../../components/expenses/ExpenseDialog'
import { Wallet, ArrowUpRight, Receipt, LucideIcon, TrendingUp } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user.id

  if (!userId) return null

  // Fetch Full Profile for Currency & Budget
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  const currency = profile?.currency || '$'
  const monthlyBudget = profile?.monthly_budget || 0

  // Fetch current month's expenses
  const startMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const endMonth = format(endOfMonth(new Date()), 'yyyy-MM-dd')

  const { data: expenses } = await supabase
    .from('expenses')
    .select(`
        *,
        category:categories(*)
    `)
    .eq('user_id', userId)
    .gte('date', startMonth)
    .lte('date', endMonth)
    .order('date', { ascending: true })

  // Calculate stats
  const totalSpent = expenses?.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0) || 0
  const transactionCount = expenses?.length || 0
  const budgetProgress = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0
  
  // Category Breakdown
  const categoryTotals = expenses?.reduce((acc: any, exp: any) => {
    const catName = exp.category?.name || 'Uncategorized'
    acc[catName] = (acc[catName] || 0) + Number(exp.amount)
    return acc
  }, {})

  const topCategory = Object.entries(categoryTotals || {})
    .sort(([, a]: any, [, b]: any) => b - a)[0]?.[0] || 'N/A'

  // Daily Spending (Last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayTotal = expenses
      ?.filter((exp: any) => exp.date === dateStr)
      .reduce((sum: number, exp: any) => sum + Number(exp.amount), 0) || 0
    
    return {
      name: format(date, 'MMM dd'),
      total: dayTotal
    }
  })

  // Chart Data for Category
  const categoryChartData = Object.entries(categoryTotals || {}).map(([name, total]) => ({
    name,
    total: total as number
  }))

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Analytics Overview
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Analyze your spending habits for {format(new Date(), 'MMMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
           <ExpenseDialog userId={userId} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard 
            title="Total Spent" 
            value={`${currency}${totalSpent.toLocaleString()}`} 
            description="vs last month" 
            trend="+12.5%" 
            icon={Wallet} 
        />
        <StatCard 
            title="Transactions" 
            value={transactionCount.toString()} 
            description="this month" 
            icon={Receipt} 
        />
        <StatCard 
            title="Top Category" 
            value={topCategory} 
            description="highest spending" 
            icon={TrendingUp} 
        />
        <StatCard 
            title="Daily Average" 
            value={`${currency}${(totalSpent / 30).toFixed(2)}`} 
            description="automated calculation" 
            icon={ArrowUpRight} 
        />
        
        {/* Budget Progress Card */}
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 relative overflow-hidden group">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">Monthly Budget</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold flex items-baseline gap-1">
                    {currency}{totalSpent.toFixed(0)} 
                    <span className="text-xs font-normal text-zinc-400">/ {currency}{monthlyBudget.toFixed(0)}</span>
                </div>
                <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                        <span>Progress</span>
                        <span>{budgetProgress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-1000 ${budgetProgress > 90 ? 'bg-red-500' : budgetProgress > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm dark:bg-zinc-900/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Daily Spending</CardTitle>
            <CardDescription>Visual representation of your daily costs</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 h-[350px]">
            <Overview data={last30Days} />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3 border-none shadow-sm dark:bg-zinc-900/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Spending by Category</CardTitle>
            <CardDescription>Breakdown across your budget areas</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <CategoryChart data={categoryChartData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, description, trend, icon: Icon }: { 
    title: string; 
    value: string; 
    description: string; 
    trend?: string;
    icon: LucideIcon 
}) {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="h-20 w-20 rotate-12 translate-x-4 translate-y--4" />
      </div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</CardTitle>
        <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg">
          <Icon className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
          <span className="text-emerald-500 font-medium mr-1">{trend}</span>
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
