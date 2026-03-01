import { withBasePath } from "./base-path"

const STEAM_PROFILE_URL = "https://steamcommunity.com/profiles"
const STEAM_ID_PATTERN = /^\d{17}$/
const PROFILE_REQUEST_TIMEOUT_MS = 6000
const DEFAULT_STEAM_PROFILE_PROXY_BASE = "https://api.codetabs.com/v1/proxy/?quest="
const STEAM_PROFILE_PROXY_BASE =
  process.env.NEXT_PUBLIC_STEAM_PROFILE_PROXY_BASE ?? DEFAULT_STEAM_PROFILE_PROXY_BASE

const avatarUrlCache = new Map<string, string | null>()
const pendingAvatarRequests = new Map<string, Promise<string | null>>()

function buildProfileXmlProxyUrl(steamId: string): string {
  const profileUrl = `${STEAM_PROFILE_URL}/${steamId}?xml=1`
  return `${STEAM_PROFILE_PROXY_BASE}${encodeURIComponent(profileUrl)}`
}

function extractAvatarUrlFromXml(xmlPayload: string): string | null {
  const avatarMatch = xmlPayload.match(/<avatarFull>\s*<!\[CDATA\[(.+?)\]\]>\s*<\/avatarFull>/i)
  return avatarMatch?.[1]?.trim() || null
}

async function fetchTextWithTimeout(url: string, timeoutMs: number): Promise<string> {
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      cache: "force-cache",
      signal: abortController.signal,
    })

    if (!response.ok) {
      throw new Error(`Avatar proxy request failed: ${response.status}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

export async function resolveSteamAvatarUrl(steamId: string): Promise<string | null> {
  const normalizedSteamId = steamId.trim()
  if (!normalizedSteamId || !STEAM_ID_PATTERN.test(normalizedSteamId)) {
    return null
  }

  if (avatarUrlCache.has(normalizedSteamId)) {
    return avatarUrlCache.get(normalizedSteamId) ?? null
  }

  const pendingRequest = pendingAvatarRequests.get(normalizedSteamId)
  if (pendingRequest) {
    return pendingRequest
  }

  const request = (async () => {
    try {
      const xmlPayload = await fetchTextWithTimeout(buildProfileXmlProxyUrl(normalizedSteamId), PROFILE_REQUEST_TIMEOUT_MS)
      const avatarUrl = extractAvatarUrlFromXml(xmlPayload)
      avatarUrlCache.set(normalizedSteamId, avatarUrl)
      return avatarUrl
    } catch {
      avatarUrlCache.set(normalizedSteamId, null)
      return null
    } finally {
      pendingAvatarRequests.delete(normalizedSteamId)
    }
  })()

  pendingAvatarRequests.set(normalizedSteamId, request)
  return request
}

export function getSteamAvatarFallbackUrl(): string {
  return withBasePath("/placeholder-user.jpg")
}
