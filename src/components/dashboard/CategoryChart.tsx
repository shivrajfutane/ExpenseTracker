"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from "recharts"

export function CategoryChart({ data }: { data: { name: string; total: number }[] }) {
  const colors = ['#000', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7', '#f4f4f5']

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
        <XAxis
          type="number"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <YAxis
          dataKey="name"
          type="category"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.05)' }}
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.8)', 
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            border: '1px solid #e4e4e7',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
          itemStyle={{ color: '#000', fontWeight: 'bold' }}
        />
        <Bar
          dataKey="total"
          radius={[0, 6, 6, 0]}
          barSize={20}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
