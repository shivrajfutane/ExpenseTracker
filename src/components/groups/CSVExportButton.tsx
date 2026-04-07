'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

interface CSVExportButtonProps {
  groupName: string;
  splitExpenses: any[];
}

export function CSVExportButton({ groupName, splitExpenses }: CSVExportButtonProps) {
  const handleExport = () => {
    const header = "Date,Title,Amount,Paid By\n";
    const rows = (splitExpenses || []).map((exp: any) => 
      `${format(new Date(exp.date), 'yyyy-MM-dd')},${exp.title.replace(/,/g, '')},${exp.total_amount},${exp.paid_by}`
    ).join("\n");
    
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `expenses-${groupName}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-zinc-900 group"
      onClick={handleExport}
    >
      <Download className="mr-2 h-3 w-3 transition-transform group-hover:-translate-y-0.5" />
      Download History (CSV)
    </Button>
  );
}
