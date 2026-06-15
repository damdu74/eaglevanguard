"use client"

import { useRouter, usePathname } from "next/navigation"
import { useCallback, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Users } from "lucide-react"
import Link from "next/link"

interface Player {
  id: string
  steamName: string | null
  discordName: string | null
  name: string | null
  customAvatar: string | null
  steamAvatar: string | null
  discordAvatar: string | null
  image: string | null
  _count: { memberships: number }
}

interface Props {
  players: Player[]
  total: number
  initialQuery: string
}

export function EagleVanguardPlayersManager({ players, total, initialQuery }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      startTransition(() => {
        if (value.trim().length >= 2) {
          router.push(`${pathname}?q=${encodeURIComponent(value.trim())}`)
        } else {
          router.push(pathname)
        }
      })
    },
    [router, pathname]
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          defaultValue={initialQuery}
          onChange={handleSearch}
          placeholder="Rechercher un joueur…"
          className="pl-9"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {initialQuery.length >= 2
          ? `${total} résultat${total > 1 ? "s" : ""} pour « ${initialQuery} »`
          : `${total} joueur${total > 1 ? "s" : ""}`}
      </p>

      {players.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground text-center">
          <Users className="h-10 w-10" />
          <p className="text-sm font-medium">
            {initialQuery.length >= 2 ? "Aucun joueur trouvé" : "Aucun joueur inscrit"}
          </p>
        </div>
      ) : (
        <div className="rounded-md border divide-y">
          {players.map((player) => {
            const displayName = player.steamName ?? player.discordName ?? player.name ?? "Joueur"
            const avatar = player.customAvatar ?? player.steamAvatar ?? player.discordAvatar ?? player.image
            return (
              <Link
                key={player.id}
                href={`/profile/${player.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={avatar ?? undefined} />
                    <AvatarFallback className="text-xs">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{displayName}</span>
                </div>
                {player._count.memberships > 0 && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {player._count.memberships} communauté{player._count.memberships > 1 ? "s" : ""}
                  </Badge>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
