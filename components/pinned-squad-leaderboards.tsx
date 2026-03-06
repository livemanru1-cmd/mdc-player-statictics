"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlayerAvatar } from "@/components/player-avatar"
import type { PastGameSummary } from "@/lib/data-utils"
import { getSquadToneClasses } from "@/lib/squad-utils"
import { Shield, Target, Trophy, Users } from "lucide-react"

interface PinnedSquadLeaderboardsProps {
  games: PastGameSummary[]
  pinnedPlayerIds: string[]
}

export function PinnedSquadLeaderboards({ games, pinnedPlayerIds }: PinnedSquadLeaderboardsProps) {
  const squadStats = useMemo(() => {
    const pinnedSet = new Set(pinnedPlayerIds)
    const squads = new Map<
      string,
      {
        label: string
        games: number
        wins: number
        kills: number
        deaths: number
        impact: number
        uniquePlayers: Set<string>
        players: Map<
          string,
          {
            player_id: string
            nickname: string
            steam_id: string
            games: number
            wins: number
            kills: number
            deaths: number
            impact: number
          }
        >
      }
    >()

    games.forEach((game) => {
      const playersBySquad = new Map<string, typeof game.players>()

      game.players.forEach((player) => {
        if (!pinnedSet.has(player.player_id)) {
          return
        }

        const squadLabel = player.squad_label || player.squad_labels[0] || "Без отряда"
        if (!playersBySquad.has(squadLabel)) {
          playersBySquad.set(squadLabel, [])
        }
        playersBySquad.get(squadLabel)?.push(player)
      })

      playersBySquad.forEach((playersInSquad, squadLabel) => {
        if (!squads.has(squadLabel)) {
          squads.set(squadLabel, {
            label: squadLabel,
            games: 0,
            wins: 0,
            kills: 0,
            deaths: 0,
            impact: 0,
            uniquePlayers: new Set<string>(),
            players: new Map(),
          })
        }

        const squad = squads.get(squadLabel)
        if (!squad) return

        squad.games += 1
        squad.kills += playersInSquad.reduce((sum, player) => sum + player.kills, 0)
        squad.deaths += playersInSquad.reduce((sum, player) => sum + player.deaths, 0)
        squad.impact += playersInSquad.reduce((sum, player) => sum + player.impactScore, 0)
        if (game.is_win) {
          squad.wins += 1
        }

        playersInSquad.forEach((player) => {
          squad.uniquePlayers.add(player.player_id)

          if (!squad.players.has(player.player_id)) {
            squad.players.set(player.player_id, {
              player_id: player.player_id,
              nickname: player.nickname,
              steam_id: player.steam_id,
              games: 0,
              wins: 0,
              kills: 0,
              deaths: 0,
              impact: 0,
            })
          }

          const squadPlayer = squad.players.get(player.player_id)
          if (!squadPlayer) return

          squadPlayer.games += 1
          squadPlayer.kills += player.kills
          squadPlayer.deaths += player.deaths
          squadPlayer.impact += player.impactScore
          if (game.is_win) {
            squadPlayer.wins += 1
          }
        })
      })
    })

    return Array.from(squads.values())
      .map((squad) => ({
        ...squad,
        winRate: squad.games > 0 ? (squad.wins / squad.games) * 100 : 0,
        kd: squad.deaths > 0 ? squad.kills / squad.deaths : squad.kills,
        avgImpact: squad.games > 0 ? squad.impact / squad.games : 0,
        playersRanked: Array.from(squad.players.values())
          .map((player) => ({
            ...player,
            winRate: player.games > 0 ? (player.wins / player.games) * 100 : 0,
            kd: player.deaths > 0 ? player.kills / player.deaths : player.kills,
            avgImpact: player.games > 0 ? player.impact / player.games : 0,
          }))
          .sort((left, right) => {
            if (right.avgImpact !== left.avgImpact) return right.avgImpact - left.avgImpact
            if (right.kills !== left.kills) return right.kills - left.kills
            return right.games - left.games
          }),
      }))
      .sort((left, right) => {
        if (right.avgImpact !== left.avgImpact) return right.avgImpact - left.avgImpact
        if (right.winRate !== left.winRate) return right.winRate - left.winRate
        return right.games - left.games
      })
  }, [games, pinnedPlayerIds])

  if (pinnedPlayerIds.length === 0) {
    return (
      <Card className="border-border/50 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-christmas-snow">
            <Shield className="w-4 h-4 text-christmas-gold" />
            Топы по отрядам
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Закрепите игроков в фильтрах ретроспективы, чтобы увидеть рейтинг отрядов и лидеров внутри каждого отряда.
        </CardContent>
      </Card>
    )
  }

  if (squadStats.length === 0) {
    return (
      <Card className="border-border/50 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-christmas-snow">
            <Shield className="w-4 h-4 text-christmas-gold" />
            Топы по отрядам
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          У закрепленных игроков нет данных по отрядам в текущем срезе.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-christmas-snow">Топы по отрядам</p>
          <p className="text-sm text-muted-foreground">Рейтинг отрядов и лидеры внутри них для закрепленных игроков</p>
        </div>
        <Badge variant="outline" className="border-christmas-gold/30 text-christmas-gold">
          {squadStats.length} отрядов
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {squadStats.map((squad, index) => {
          const tone = getSquadToneClasses(squad.label)

          return (
            <Card key={squad.label} className={`border ${tone.panel}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={tone.badge}>
                        #{index + 1} • {squad.label}
                      </Badge>
                      <Badge variant="outline" className="border-christmas-gold/30 text-christmas-gold">
                        {squad.uniquePlayers.size} игроков
                      </Badge>
                    </div>
                    <CardTitle className="text-base text-christmas-snow">Сквадовый рейтинг</CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-christmas-snow">{squad.avgImpact.toFixed(1)}</p>
                    <p className="text-[11px] text-muted-foreground">ср. импакт</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border/50 bg-background/35 p-3">
                    <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Users className="w-3.5 h-3.5 text-christmas-gold" />
                      Игры
                    </p>
                    <p className="mt-2 text-lg font-semibold text-christmas-snow">{squad.games}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-background/35 p-3">
                    <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Trophy className="w-3.5 h-3.5 text-christmas-green" />
                      WR
                    </p>
                    <p className="mt-2 text-lg font-semibold text-christmas-snow">{squad.winRate.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-background/35 p-3">
                    <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Target className="w-3.5 h-3.5 text-christmas-red" />
                      K/D
                    </p>
                    <p className="mt-2 text-lg font-semibold text-christmas-snow">{squad.kd.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-christmas-snow">Лидеры внутри отряда</p>
                  {squad.playersRanked.slice(0, 5).map((player, playerIndex) => (
                    <div
                      key={`${squad.label}-${player.player_id}`}
                      className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/35 px-3 py-2"
                    >
                      <span className="w-6 text-center font-mono text-sm text-christmas-gold">{playerIndex + 1}</span>
                      <PlayerAvatar steamId={player.steam_id} nickname={player.nickname} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-christmas-snow">{player.nickname}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {player.games} игр • WR {player.winRate.toFixed(0)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-christmas-snow">{player.avgImpact.toFixed(1)}</p>
                        <p className="text-[11px] text-muted-foreground">K/D {player.kd.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
