export type SquadToneKey =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "orange"
  | "purple"
  | "pink"
  | "cyan"
  | "brown"
  | "black"
  | "white"
  | "neutral"

export type SquadIdentifier = number | string | null | undefined

const SQUAD_LABEL_ALIASES = new Map<string, string>([["rfd", "RED"]])

function normalizeSquadToken(value: SquadIdentifier): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === "string") {
    return value.trim()
  }

  return ""
}

export function isSelectableSquadLabel(value: SquadIdentifier): boolean {
  const normalized = normalizeSquadToken(value).toLowerCase()

  if (!normalized || normalized === "без отряда") {
    return false
  }

  return !/^(?:0|0\s+(?:отряд|сквад|squad)|(?:отряд|сквад|squad)\s+0)$/.test(normalized)
}

export function getSquadLabel(squadNo: SquadIdentifier, squadDomain: string[] = []): string {
  const normalized = normalizeSquadToken(squadNo)
  if (!normalized) {
    return "Без отряда"
  }

  const domain = squadDomain.map((value) => value.trim()).filter(Boolean)
  const numericValue = Number(normalized)
  if (Number.isFinite(numericValue) && numericValue > 0 && String(Math.trunc(numericValue)) === normalized) {
    return domain[numericValue - 1] ?? `Сквад ${numericValue}`
  }

  const byKey = new Map(domain.map((value) => [value.toLowerCase(), value]))
  const directLabel = byKey.get(normalized.toLowerCase())
  if (directLabel) {
    return directLabel
  }

  const aliasLabel = SQUAD_LABEL_ALIASES.get(normalized.toLowerCase())
  if (aliasLabel) {
    return byKey.get(aliasLabel.toLowerCase()) ?? aliasLabel
  }

  return normalized
}

export function getSquadLabels(squadNos: SquadIdentifier[], squadDomain: string[] = []): string[] {
  return Array.from(
    new Set(
      squadNos
        .map((value) => normalizeSquadToken(value))
        .filter(Boolean)
        .map((value) => getSquadLabel(value, squadDomain)),
    ),
  )
}

export function getFactionMatchup(
  faction1: string | null | undefined,
  faction2: string | null | undefined,
): string | null {
  const left = faction1?.trim()
  const right = faction2?.trim()

  if (left && right) {
    return `${left} vs ${right}`
  }

  return left || right || null
}

export function getSquadToneKey(label: string | null | undefined): SquadToneKey {
  const normalized = SQUAD_LABEL_ALIASES.get((label ?? "").trim().toLowerCase())?.toLowerCase() ?? (label ?? "").trim().toLowerCase()

  if (!normalized) return "neutral"
  if (normalized.includes("red") || normalized.includes("крас")) return "red"
  if (normalized.includes("blue") || normalized.includes("син")) return "blue"
  if (normalized.includes("green") || normalized.includes("зел")) return "green"
  if (normalized.includes("yellow") || normalized.includes("желт")) return "yellow"
  if (normalized.includes("orange") || normalized.includes("оранж")) return "orange"
  if (normalized.includes("purple") || normalized.includes("violet") || normalized.includes("фиол")) return "purple"
  if (normalized.includes("pink") || normalized.includes("роз")) return "pink"
  if (normalized.includes("cyan") || normalized.includes("teal") || normalized.includes("бирюз")) return "cyan"
  if (normalized.includes("brown") || normalized.includes("корич")) return "brown"
  if (normalized.includes("black") || normalized.includes("черн")) return "black"
  if (normalized.includes("white") || normalized.includes("бел")) return "white"

  return "neutral"
}

export function getSquadToneClasses(label: string | null | undefined): {
  badge: string
  panel: string
  dot: string
} {
  switch (getSquadToneKey(label)) {
    case "red":
      return {
        badge: "border-red-500/35 bg-red-500/10 text-red-200",
        panel: "border-red-500/35 bg-red-500/6",
        dot: "bg-red-500",
      }
    case "blue":
      return {
        badge: "border-cyan-500/35 bg-cyan-500/10 text-cyan-200",
        panel: "border-cyan-500/35 bg-cyan-500/6",
        dot: "bg-cyan-500",
      }
    case "green":
      return {
        badge: "border-emerald-500/35 bg-emerald-500/10 text-emerald-200",
        panel: "border-emerald-500/35 bg-emerald-500/6",
        dot: "bg-emerald-500",
      }
    case "yellow":
      return {
        badge: "border-yellow-500/35 bg-yellow-500/10 text-yellow-200",
        panel: "border-yellow-500/35 bg-yellow-500/6",
        dot: "bg-yellow-500",
      }
    case "orange":
      return {
        badge: "border-orange-500/35 bg-orange-500/10 text-orange-200",
        panel: "border-orange-500/35 bg-orange-500/6",
        dot: "bg-orange-500",
      }
    case "purple":
      return {
        badge: "border-violet-500/35 bg-violet-500/10 text-violet-200",
        panel: "border-violet-500/35 bg-violet-500/6",
        dot: "bg-violet-500",
      }
    case "pink":
      return {
        badge: "border-pink-500/35 bg-pink-500/10 text-pink-200",
        panel: "border-pink-500/35 bg-pink-500/6",
        dot: "bg-pink-500",
      }
    case "cyan":
      return {
        badge: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
        panel: "border-cyan-500/20 bg-cyan-500/10",
        dot: "bg-cyan-400",
      }
    case "brown":
      return {
        badge: "border-amber-700/35 bg-amber-700/10 text-amber-200",
        panel: "border-amber-700/35 bg-amber-700/6",
        dot: "bg-amber-700",
      }
    case "black":
      return {
        badge: "border-neutral-500/45 bg-neutral-700/18 text-neutral-100",
        panel: "border-neutral-500/45 bg-neutral-700/18",
        dot: "bg-neutral-500 ring-1 ring-neutral-300/80",
      }
    case "white":
      return {
        badge: "border-slate-100/52 bg-slate-100/16 text-slate-50",
        panel: "border-slate-100/52 bg-slate-100/16",
        dot: "bg-slate-100 ring-1 ring-slate-500/80",
      }
    default:
      return {
        badge: "border-muted/40 bg-background/60 text-muted-foreground",
        panel: "border-border/50 bg-background/40",
        dot: "bg-muted-foreground",
      }
  }
}
