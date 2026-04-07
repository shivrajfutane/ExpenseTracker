'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { format } from 'date-fns'

interface HistoryCSVExportButtonProps {
    expenses: any[];
    filename?: string;
}

export function HistoryCSVExportButton({ expenses, filename = 'expense-history' }: HistoryCSVExportButtonProps) {
  const downloadCSV = () => {
    if (!expenses || expenses.length === 0) return;

    const headers = ["Date", "Description", "Amount", "Category"]
    const rows = expenses.map((exp: any) => {
      const date = format(new Date(exp.date), 'yyyy-MM-dd')
      const title = (exp.title || '').replace(/,/g, '')
      const amount = exp.amount
      const category = exp.category?.name || 'Uncategorized'
      return `${date},${title},${amount},${category}`
    }).join("\n")

    const csvContent = `${headers.join(",")}\n${rows}`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={downloadCSV}
      className="h-8 text-[10px] uppercase font-bold tracking-wider text-zinc-500 hover:text-zinc-900 gap-2 border border-zinc-200 dark:border-zinc-800"
    >
      <Download className="h-3 w-3" />
      Export history (CSV)
    </Button>
  )
}
