import React from 'react'
import { TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card'

interface VentasChartProps {
  data: {
    mes: string
    ventas: number
  }[]
}

export function VentasChart({ data }: VentasChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas Mensuales</CardTitle>
        <CardDescription>Resumen de ventas por mes</CardDescription>
      </CardHeader>
      <CardContent>
        <BarChart
          width={600}
          height={300}
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Bar dataKey="ventas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
            <LabelList dataKey="ventas" position="top" />
          </Bar>
        </BarChart>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Tendencia de ventas <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Mostrando el total de ventas por mes
        </div>
      </CardFooter>
    </Card>
  )
} 