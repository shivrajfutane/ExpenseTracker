import { createClient } from '@/lib/supabase-server'
import { ExpenseTable } from '@/components/expenses/ExpenseTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
    ChevronLeft, 
    ChevronRight, 
    Search, 
    Filter, 
    ArrowUpDown, 
    X
} from 'lucide-react'
import Link from 'next/link'

interface HistoryPageProps {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    category?: string;
    q?: string;
  }>
}

export const dynamic = 'force-dynamic'

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const params = await searchParams;
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user.id

  if (!userId) return null

  const page = Number(params.page) || 1
  const limit = 10
  const offset = (page - 1) * limit
  const sort = params.sort || 'date.desc'
  const categoryFilter = params.category || 'all'
  const query = params.q || ''

  const [sortField, sortOrder] = sort.split('.')

  // Fetch Categories for the filter
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)

  // Build query for expenses
  let baseQuery = supabase
    .from('expenses')
    .select('*, category:categories(*)', { count: 'exact' })
    .eq('user_id', userId)

  const { data: profile } = await supabase
    .from('profiles')
    .select('currency')
    .eq('id', userId)
    .single()

  const currency = profile?.currency || '$'

  if (categoryFilter !== 'all') {
    baseQuery = baseQuery.eq('category_id', categoryFilter)
  }

  if (query) {
    baseQuery = baseQuery.ilike('title', `%${query}%`)
  }

  // Handle sorting
  baseQuery = baseQuery.order(sortField || 'date', { ascending: sortOrder === 'asc' })

  // Handle pagination
  const { data: expenses, count } = await baseQuery.range(offset, offset + limit - 1)

  const totalPages = count ? Math.ceil(count / limit) : 1

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          Expense History
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Review and manage all your past transactions.
        </p>
      </div>

      <Card className="border-none shadow-sm dark:bg-zinc-900/40 backdrop-blur-md">
        <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-2 max-w-sm">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Find expense..."
                            className="pl-9 h-10 w-full"
                            defaultValue={query}
                        />
                    </div>
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <Select defaultValue={categoryFilter}>
                        <SelectTrigger className="w-[150px] h-10">
                            <Filter className="mr-2 h-4 w-4 text-zinc-500" />
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories?.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select defaultValue={sort}>
                        <SelectTrigger className="w-[170px] h-10">
                            <ArrowUpDown className="mr-2 h-4 w-4 text-zinc-500" />
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date.desc">Newest First</SelectItem>
                            <SelectItem value="date.asc">Oldest First</SelectItem>
                            <SelectItem value="amount.desc">Highest Amount</SelectItem>
                            <SelectItem value="amount.asc">Lowest Amount</SelectItem>
                        </SelectContent>
                    </Select>

                    {(categoryFilter !== 'all' || query !== '' || sort !== 'date.desc') && (
                        <Button variant="ghost" size="sm" className="h-10 px-2 text-zinc-500">
                            <Link href="/dashboard/history" className="flex items-center">
                                <X className="h-4 w-4 mr-1" />
                                Clear
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <ExpenseTable expenses={expenses || []} userId={userId} currency={currency} />
          
          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-sm text-zinc-500">
              Showing <span className="font-medium">{expenses?.length || 0}</span> of <span className="font-medium">{count || 0}</span> expenses
            </p>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1}>
                    {page > 1 ? (
                        <Link href={`/dashboard/history?page=${page - 1}&category=${categoryFilter}&sort=${sort}&q=${query}`} className="flex items-center">
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Link>
                    ) : (
                        <div className="flex items-center">
                             <ChevronLeft className="h-4 w-4 mr-1" />
                             Previous
                        </div>
                    )}
                </Button>
                <div className="flex items-center justify-center text-sm font-medium h-9 px-4 border rounded-md">
                    Page {page} of {totalPages}
                </div>
                <Button variant="outline" size="sm" disabled={page >= totalPages}>
                    {page < totalPages ? (
                        <Link href={`/dashboard/history?page=${page + 1}&category=${categoryFilter}&sort=${sort}&q=${query}`} className="flex items-center">
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                    ) : (
                        <div className="flex items-center">
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </div>
                    )}
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
