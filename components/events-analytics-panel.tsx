"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts"
import type { PastGameSummary } from "@/lib/data-utils"
import { Activity, Crosshair, Heart, Shield, Skull, TrendingUp } from "lucide-react"

type AnalyticsMetric = "winRate" | "kills" | "deaths" | "downs" | "revives" | "kd" | "participants"
type AnalyticsMode = "per_match" | "cumulative"
type AnalyticsScope = "team" | "pinned"

interface EventsAnalyticsPanelProps {
  games: PastGameSummary[]
  pinnedPlayerIds: string[]
}

const METRIC_LABELS: Record<AnalyticsMetric, string> = {
  winRate: "Win Rate",
  kills: "Убийства",
  deaths: "Смерти",
  downs: "Ноки",
  revives: "Поднятия",
  kd: "K/D",
  participants: "Участники",
}

function formatMatchDate(value: string): string {
  if (!value) return "N/A"

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return `${String(parsed.getDate()).padStart(2, "0")}.${String(parsed.getMonth() + 1).padStart(2, "0")}`
}

function formatMetricValue(metric: AnalyticsMetric, value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "н/д"
  }

  if (metric === "winRate") {
    return `${value.toFixed(1)}%`
  }

  if (metric === "kd") {
    return value.toFixed(2)
  }

  return value.toFixed(1)
}

export function EventsAnalyticsPanel({ games, pinnedPlayerIds }: EventsAnalyticsPanelProps) {
  const [metric, setMetric] = useState<AnalyticsMetric>("kd")
  const [mode, setMode] = useState<AnalyticsMode>("cumulative")
  const [scope, setScope] = useState<AnalyticsScope>("team")

  useEffect(() => {
    if (scope === "pinned" && pinnedPlayerIds.length === 0) {
      setScope("team")
    }
  }, [pinnedPlayerIds.length, scope])

  const effectiveScope: AnalyticsScope = scope === "pinned" && pinnedPlayerIds.length > 0 ? "pinned" : "team"

  const chartData = useMemo(() => {
    const pinnedSet = new Set(pinnedPlayerIds)
    const sortedGames = [...games].sort((left, right) => {
      const leftTime = Number.isNaN(new Date(left.started_at).getTime()) ? 0 : new Date(left.started_at).getTime()
      const rightTime = Number.isNaN(new Date(right.started_at).getTime()) ? 0 : new Date(right.started_at).getTime()
      return leftTime - rightTime
    })

    let matchesIncluded = 0
    let resolvedMatches = 0
    let cumulativeWins = 0
    let cumulativeKills = 0
    let cumulativeDeaths = 0
    let cumulativeDowns = 0
    let cumulativeRevives = 0
    let cumulativeParticipants = 0

    return sortedGames.flatMap((game) => {
      const scopedPlayers =
        effectiveScope === "pinned" ? game.players.filter((player) => pinnedSet.has(player.player_id)) : game.players

      if (effectiveScope === "pinned" && scopedPlayers.length === 0) {
        return []
      }

      matchesIncluded += 1

      const aggregate =
        effectiveScope === "team"
          ? {
              kills: game.totalKills,
              deaths: game.totalDeaths,
              downs: game.totalDowns,
              revives: game.totalRevives,
              participants: game.participants,
            }
          : {
              kills: scopedPlayers.reduce((sum, player) => sum + player.kills, 0),
              deaths: scopedPlayers.reduce((sum, player) => sum + player.deaths, 0),
              downs: scopedPlayers.reduce((sum, player) => sum + player.downs, 0),
              revives: scopedPlayers.reduce((sum, player) => sum + player.revives, 0),
              participants: scopedPlayers.length,
            }

      cumulativeKills += aggregate.kills
      cumulativeDeaths += aggregate.deaths
      cumulativeDowns += aggregate.downs
      cumulativeRevives += aggregate.revives
      cumulativeParticipants += aggregate.participants

      if (game.is_win !== null) {
        resolvedMatches += 1
        if (game.is_win) {
          cumulativeWins += 1
        }
      }

      const perMatchKD = aggregate.deaths > 0 ? aggregate.kills / aggregate.deaths : aggregate.kills
      const cumulativeKD = cumulativeDeaths > 0 ? cumulativeKills / cumulativeDeaths : cumulativeKills
      const cumulativeWinRate = resolvedMatches > 0 ? (cumulativeWins / resolvedMatches) * 100 : 0
      const perMatchWinRate =
        game.is_win === true ? 100 : game.is_win === false ? 0 : null

      const perMetricValue: Record<AnalyticsMetric, number | null> = {
        winRate: perMatchWinRate,
        kills: aggregate.kills,
        deaths: aggregate.deaths,
        downs: aggregate.downs,
        revives: aggregate.revives,
        kd: perMatchKD,
        participants: aggregate.participants,
      }

      const cumulativeMetricValue: Record<AnalyticsMetric, number> = {
        winRate: cumulativeWinRate,
        kills: cumulativeKills / matchesIncluded,
        deaths: cumulativeDeaths / matchesIncluded,
        downs: cumulativeDowns / matchesIncluded,
        revives: cumulativeRevives / matchesIncluded,
        kd: cumulativeKD,
        participants: cumulativeParticipants / matchesIncluded,
      }

      const metricValue = mode === "per_match" ? perMetricValue[metric] : cumulativeMetricValue[metric]
      const baselineValue = metric === "winRate" ? cumulativeKD : cumulativeWinRate
      const baselineLabel = metric === "winRate" ? "Кумулятивный K/D" : "Кумулятивный WR"

      return [
        {
          dateLabel: formatMatchDate(game.started_at),
          eventLabel: game.map,
          metricValue,
          baselineValue,
          baselineLabel,
          participants: aggregate.participants,
          kills: aggregate.kills,
          deaths: aggregate.deaths,
          downs: aggregate.downs,
          revives: aggregate.revives,
          cumulativeWinRate,
          cumulativeKD,
        },
      ]
    })
  }, [effectiveScope, games, metric, mode, pinnedPlayerIds])

  const summary = useMemo(() => {
    if (chartData.length === 0) {
      return {
        matches: 0,
        winRate: 0,
        avgKills: 0,
        avgRevives: 0,
        kd: 0,
      }
    }

    const totalKills = chartData.reduce((sum, point) => sum + point.kills, 0)
    const totalDeaths = chartData.reduce((sum, point) => sum + point.deaths, 0)
    const totalRevives = chartData.reduce((sum, point) => sum + point.revives, 0)

    return {
      matches: chartData.length,
      winRate: chartData[chartData.length - 1]?.cumulativeWinRate ?? 0,
      avgKills: totalKills / chartData.length,
      avgRevives: totalRevives / chartData.length,
      kd: totalDeaths > 0 ? totalKills / totalDeaths : totalKills,
    }
  }, [chartData])

  return (
    <Card className="border-christmas-gold/20 bg-card/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-christmas-snow">
          <TrendingUp className="w-4 h-4 text-christmas-gold" />
          Аналитические кривые по фильтрам
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Параметр</p>
            <Select value={metric} onValueChange={(value) => setMetric(value as AnalyticsMetric)}>
              <SelectTrigger className="w-full border-christmas-gold/20 bg-background/50 text-christmas-snow">
                <SelectValue placeholder="Метрика" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kd">K/D</SelectItem>
                <SelectItem value="winRate">Win Rate</SelectItem>
                <SelectItem value="kills">Убийства</SelectItem>
                <SelectItem value="deaths">Смерти</SelectItem>
                <SelectItem value="downs">Ноки</SelectItem>
                <SelectItem value="revives">Поднятия</SelectItem>
                <SelectItem value="participants">Участники</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Режим</p>
            <Select value={mode} onValueChange={(value) => setMode(value as AnalyticsMode)}>
              <SelectTrigger className="w-full border-christmas-gold/20 bg-background/50 text-christmas-snow">
                <SelectValue placeholder="Режим" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cumulative">Кумулятивно</SelectItem>
                <SelectItem value="per_match">По матчам</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Срез</p>
            <Select value={effectiveScope} onValueChange={(value) => setScope(value as AnalyticsScope)}>
              <SelectTrigger className="w-full border-christmas-gold/20 bg-background/50 text-christmas-snow">
                <SelectValue placeholder="Срез" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Весь состав</SelectItem>
                <SelectItem value="pinned" disabled={pinnedPlayerIds.length === 0}>
                  Закрепленные игроки
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <div className="rounded-xl border border-christmas-gold/20 bg-christmas-gold/10 p-3">
            <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Activity className="w-3.5 h-3.5 text-christmas-gold" />
              Матчи
            </p>
            <p className="mt-2 text-2xl font-semibold text-christmas-snow">{summary.matches}</p>
          </div>
          <div className="rounded-xl border border-christmas-green/20 bg-christmas-green/10 p-3">
            <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-christmas-green" />
              WR
            </p>
            <p className="mt-2 text-2xl font-semibold text-christmas-snow">{summary.winRate.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
            <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Crosshair className="w-3.5 h-3.5 text-blue-300" />
              Ср. убийства
            </p>
            <p className="mt-2 text-2xl font-semibold text-christmas-snow">{summary.avgKills.toFixed(1)}</p>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-3">
            <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Heart className="w-3.5 h-3.5 text-orange-300" />
              Ср. поднятия
            </p>
            <p className="mt-2 text-2xl font-semibold text-christmas-snow">{summary.avgRevives.toFixed(1)}</p>
          </div>
          <div className="rounded-xl border border-christmas-red/20 bg-christmas-red/10 p-3">
            <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Skull className="w-3.5 h-3.5 text-christmas-red" />
              K/D
            </p>
            <p className="mt-2 text-2xl font-semibold text-christmas-snow">{summary.kd.toFixed(2)}</p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-background/35 p-6 text-sm text-muted-foreground">
            Для текущих фильтров и выбранного среза не хватает данных для построения кривых.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="text-christmas-snow">
                Кривая: {METRIC_LABELS[metric]} • {mode === "cumulative" ? "кумулятивно" : "по матчам"}
              </p>
              <p className="text-muted-foreground">
                {effectiveScope === "team" ? "Срез по всему составу" : "Срез только по закрепленным игрокам"}
              </p>
            </div>

            <div className="h-[280px] rounded-xl border border-border/50 bg-background/25 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: 0, right: 0, top: 12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.28} />
                  <XAxis
                    dataKey="dateLabel"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(value) => formatMetricValue(metric, Number(value))}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(value) =>
                      metric === "winRate" ? Number(value).toFixed(2) : `${Number(value).toFixed(0)}%`
                    }
                  />
                  {metric === "winRate" ? (
                    <ReferenceLine yAxisId="left" y={50} stroke="var(--muted-foreground)" strokeDasharray="5 5" opacity={0.4} />
                  ) : (
                    <ReferenceLine yAxisId="right" y={50} stroke="var(--muted-foreground)" strokeDasharray="5 5" opacity={0.4} />
                  )}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      color: "var(--foreground)",
                    }}
                    formatter={(value: number | null, name: string) => {
                      if (name === METRIC_LABELS[metric]) {
                        return [formatMetricValue(metric, value), name]
                      }

                      if (chartData[0]?.baselineLabel === "Кумулятивный K/D") {
                        return [value?.toFixed(2) ?? "н/д", name]
                      }

                      return [value === null || value === undefined ? "н/д" : `${value.toFixed(1)}%`, name]
                    }}
                    labelFormatter={(label, payload) => {
                      const point = payload?.[0]?.payload as { eventLabel?: string } | undefined
                      return `${label}${point?.eventLabel ? ` • ${point.eventLabel}` : ""}`
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="metricValue"
                    name={METRIC_LABELS[metric]}
                    stroke="var(--chart-4)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: "var(--chart-4)" }}
                    connectNulls
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="baselineValue"
                    name={chartData[0]?.baselineLabel ?? "Базовая линия"}
                    stroke="var(--christmas-gold)"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 4"
                    activeDot={{ r: 3, fill: "var(--christmas-gold)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[11px] text-muted-foreground">
              Правая ось показывает {metric === "winRate" ? "кумулятивный K/D" : "кумулятивный Win Rate"}, левая -
              выбранный параметр.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
