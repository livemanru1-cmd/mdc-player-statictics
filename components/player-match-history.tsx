"use client"

import { ArrowUpRight, Crosshair, Heart, Shield, Skull, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { PlayerGameHistoryEntry } from "@/lib/data-utils"
import { getSquadToneClasses } from "@/lib/squad-utils"

interface PlayerMatchHistoryProps {
  playerId: string
  games: PlayerGameHistoryEntry[]
  onOpenGame?: (eventId: string, playerId: string) => void
}

function formatMatchDate(value: string): string {
  if (!value) return "Дата не указана"

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getResultMeta(entry: Pick<PlayerGameHistoryEntry, "is_win" | "result">): {
  label: string
  className: string
} {
  if (entry.is_win === true) {
    return {
      label: "Победа",
      className: "border-christmas-green/40 bg-christmas-green/10 text-christmas-green",
    }
  }

  if (entry.is_win === false) {
    return {
      label: "Поражение",
      className: "border-christmas-red/40 bg-christmas-red/10 text-christmas-red",
    }
  }

  return {
    label: entry.result?.trim() || "Результат не указан",
    className: "border-muted/40 bg-background/60 text-muted-foreground",
  }
}

export function PlayerMatchHistory({ playerId, games, onOpenGame }: PlayerMatchHistoryProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-christmas-snow">История игр</p>
          <p className="text-[11px] text-muted-foreground">Последние матчи игрока с местом в топе матча</p>
        </div>
        <Badge variant="outline" className="border-christmas-gold/30 text-christmas-gold">
          {games.length}
        </Badge>
      </div>

      {games.length === 0 ? (
        <div className="rounded-lg border border-border/50 bg-background/40 p-3 text-sm text-muted-foreground">
          Для игрока пока нет истории матчей.
        </div>
      ) : (
        <ScrollArea className="h-[260px] rounded-lg border border-border/50 bg-background/20">
          <div className="space-y-3 p-3">
            {games.map((game) => {
              const resultMeta = getResultMeta(game)
              const impactWidth = Math.max(0, Math.min(100, game.impactShare))
              const squadTone = getSquadToneClasses(game.squad_label)

              return (
                <div key={`${game.event_id}-${game.player_id}`} className="rounded-lg border border-border/50 bg-background/55 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={resultMeta.className}>
                          {resultMeta.label}
                        </Badge>
                        <Badge variant="outline" className={squadTone.badge}>
                          {game.squad_label}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">{formatMatchDate(game.started_at)}</span>
                      </div>
                      <p className="truncate text-sm font-semibold text-christmas-snow">{game.map}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {game.event_type}
                        {game.opponent ? ` • ${game.opponent}` : ""}
                        {game.role ? ` • ${game.role}` : ""}
                      </p>
                    </div>

                    {onOpenGame && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-christmas-gold hover:bg-christmas-gold/10 hover:text-christmas-snow"
                        onClick={() => onOpenGame(game.event_id, playerId)}
                      >
                        Матч
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <div className="rounded-md border border-christmas-green/20 bg-christmas-green/10 px-2 py-1.5 text-center">
                      <Crosshair className="mx-auto mb-1 w-3.5 h-3.5 text-christmas-green" />
                      <p className="text-sm font-semibold text-christmas-snow">{game.kills}</p>
                    </div>
                    <div className="rounded-md border border-orange-500/20 bg-orange-500/10 px-2 py-1.5 text-center">
                      <Zap className="mx-auto mb-1 w-3.5 h-3.5 text-orange-400" />
                      <p className="text-sm font-semibold text-christmas-snow">{game.downs}</p>
                    </div>
                    <div className="rounded-md border border-christmas-red/20 bg-christmas-red/10 px-2 py-1.5 text-center">
                      <Skull className="mx-auto mb-1 w-3.5 h-3.5 text-christmas-red" />
                      <p className="text-sm font-semibold text-christmas-snow">{game.deaths}</p>
                    </div>
                    <div className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-1.5 text-center">
                      <Heart className="mx-auto mb-1 w-3.5 h-3.5 text-blue-300" />
                      <p className="text-sm font-semibold text-christmas-snow">{game.revives}</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>K/D {game.kd.toFixed(2)} • общий K/D {game.cumKD.toFixed(2)}</span>
                      <span className="inline-flex items-center gap-1 text-christmas-gold">
                        <Shield className="w-3.5 h-3.5" />
                        #{game.rank}/{game.participants}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-background/70">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-christmas-red via-christmas-gold to-christmas-green"
                        style={{ width: `${impactWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
