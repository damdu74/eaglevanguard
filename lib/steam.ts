const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login"
const STEAM_ID_REGEX = /https:\/\/steamcommunity\.com\/openid\/id\/(\d+)/

export function buildSteamLoginUrl(returnTo: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": new URL(returnTo).origin,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  })
  return `${STEAM_OPENID_URL}?${params.toString()}`
}

export async function verifySteamCallback(searchParams: URLSearchParams): Promise<string | null> {
  // Steam sends back openid params — verify with Steam's check_authentication
  const verifyParams = new URLSearchParams(searchParams)
  verifyParams.set("openid.mode", "check_authentication")

  const res = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  })

  const text = await res.text()
  if (!text.includes("is_valid:true")) return null

  const claimedId = searchParams.get("openid.claimed_id") ?? ""
  const match = claimedId.match(STEAM_ID_REGEX)
  return match ? match[1] : null
}

export async function fetchSteamProfile(steamId: string) {
  const apiKey = process.env.STEAM_API_KEY
  if (!apiKey || apiKey === "your-steam-api-key") {
    // Fallback profile when no API key is configured
    return { steamId, name: `Steam:${steamId}`, image: null }
  }

  const res = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`
  )
  const data = await res.json()
  const player = data?.response?.players?.[0]
  if (!player) return { steamId, name: `Steam:${steamId}`, image: null }

  return {
    steamId: player.steamid as string,
    name: player.personaname as string,
    image: player.avatarfull as string,
  }
}
