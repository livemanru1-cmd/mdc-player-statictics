"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { Calendar } from "lucide-react"
import { useMemo } from "react"

interface DailyActivityChartProps {
  data: { date: string; count: number; wins: number; cumWinRate: number }[]
}

interface SliceTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: {
      name: string
      value: number
      color: string
    }
  }>
  totalMatches: number
}

function SliceTooltip({ active, payload, totalMatches }: SliceTooltipProps) {
  if (!active || !payload?.length) {
    return null
  }

  const point = payload[0]?.payload
  if (!point) {
    return null
  }

  const percentage = totalMatches > 0 ? (point.value / totalMatches) * 100 : 0

  return (
    <div className="rounded-lg border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur">
      <p className="text-sm font-medium text-christmas-snow">{point.name}</p>
      <p className="text-xs text-muted-foreground">
        {point.value} матчей • {percentage.toFixed(1)}%
      </p>
    </div>
  )
}

export function DailyActivityChart({ data }: DailyActivityChartProps) {
  const chartData = useMemo(() => {
    const totalMatches = data.reduce((sum, point) => sum + point.count, 0)
    const totalWins = data.reduce((sum, point) => sum + point.wins, 0)
    const totalLosses = Math.max(0, totalMatches - totalWins)
    const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0

    return {
      totalMatches,
      totalWins,
      totalLosses,
      winRate,
      slices: [
        { name: "Победы", value: totalWins, color: "var(--christmas-green)" },
        { name: "Поражения", value: totalLosses, color: "var(--christmas-red)" },
      ],
    }
  }, [data])

  if (chartData.totalMatches === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-christmas-gold flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Победы и поражения за всё время
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Нет данных по результатам событий</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-christmas-gold flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Победы и поражения за всё время
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(420px,1.35fr)_minmax(320px,0.85fr)] xl:items-center">
          <div className="relative h-[320px] rounded-xl border border-border/50 bg-background/25 px-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                <Pie
                  data={chartData.slices}
                  cx="50%"
                  cy="50%"
                  innerRadius={88}
                  outerRadius={132}
                  dataKey="value"
                  paddingAngle={4}
                  cornerRadius={10}
                  stroke="var(--background)"
                  strokeWidth={3}
                >
                  {chartData.slices.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<SliceTooltip totalMatches={chartData.totalMatches} />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full border border-christmas-gold/20 bg-background/75 px-6 py-4 text-center shadow-lg backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Сыграно</p>
                <p className="text-3xl font-bold text-christmas-snow">{chartData.totalMatches}</p>
                <p className="text-sm font-semibold text-christmas-gold">{chartData.winRate.toFixed(1)}% WR</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-christmas-green/20 bg-christmas-green/10 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Победы</p>
                <p className="mt-2 text-3xl font-semibold text-christmas-snow">{chartData.totalWins}</p>
                <p className="text-sm text-christmas-green">
                  {chartData.totalMatches > 0 ? ((chartData.totalWins / chartData.totalMatches) * 100).toFixed(1) : "0.0"}%
                </p>
              </div>
              <div className="rounded-xl border border-christmas-red/20 bg-christmas-red/10 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Поражения</p>
                <p className="mt-2 text-3xl font-semibold text-christmas-snow">{chartData.totalLosses}</p>
                <p className="text-sm text-christmas-red">
                  {chartData.totalMatches > 0 ? ((chartData.totalLosses / chartData.totalMatches) * 100).toFixed(1) : "0.0"}%
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Win Rate</p>
                  <p className="mt-2 text-3xl font-semibold text-christmas-gold">{chartData.winRate.toFixed(1)}%</p>
                </div>
                <p className="max-w-[220px] text-right text-sm text-muted-foreground">
                  Карта занимает больше места, а подписи вынесены отдельно, чтобы не теряться на тёмном фоне.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {chartData.slices.map((slice) => {
                const percentage = chartData.totalMatches > 0 ? (slice.value / chartData.totalMatches) * 100 : 0

                return (
                  <div key={slice.name} className="rounded-xl border border-border/50 bg-background/30 p-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: slice.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-christmas-snow">{slice.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {slice.value} матчей • {percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
