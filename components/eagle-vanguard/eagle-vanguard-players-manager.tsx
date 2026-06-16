"use client"

import { useRouter, usePathname } from "next/navigation"
import { useCallback, useTransition, useState } from "react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Users, UserMinus, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Player {
  id: string
  steamName: string | null
  discordName: string | null
  name: string | null
  customAvatar: string | null
  steamAvatar: string | null
  discordAvatar: string | null
  image: string | null
  isMember: boolean
  _count: { memberships: number }
}

interface Props {
  players: Player[]
  total: number
  initialQuery: string
}

export function EagleVanguardPlayersManager({ players: initialPlayers, total, initialQuery }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [removingId, setRemovingId] = useState<string | null>(null)

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

  async function removeMembership(player: Player) {
    const name = player.steamName ?? player.discordName ?? player.name ?? "ce joueur"
    if (!confirm(`Retirer ${name} de la communauté ? Il devra repostuler pour revenir.`)) return
    setRemovingId(player.id)
    try {
      const res = await fetch(`/api/eagle-vanguard/members/${player.id}/membership`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, isMember: false, _count: { memberships: 0 } } : p))
      toast.success(`${name} a été retiré de la communauté`)
    } catch {
      toast.error("Erreur lors du retrait")
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          defaultValue={initialQuery}
          onChange={handleSearch}
          placeholder="Rechercher un membre…"
          className="pl-9"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {initialQuery.length >= 2
          ? `${total} résultat${total > 1 ? "s" : ""} pour « ${initialQuery} »`
          : `${total} membre${total > 1 ? "s" : ""}`}
      </p>

      {players.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground text-center">
          <Users className="h-10 w-10" />
          <p className="text-sm font-medium">
            {initialQuery.length >= 2 ? "Aucun membre trouvé" : "Aucun membre inscrit"}
          </p>
        </div>
      ) : (
        <div className="rounded-md border divide-y">
          {players.map((player) => {
            const displayName = player.steamName ?? player.discordName ?? player.name ?? "Joueur"
            const avatar = player.customAvatar ?? player.steamAvatar ?? player.discordAvatar ?? player.image
            return (
              <div key={player.id} className="flex items-center justify-between px-4 py-3">
                <Link
                  href={`/profile/${player.id}`}
                  className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={avatar ?? undefined} />
                    <AvatarFallback className="text-xs">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">{displayName}</span>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  {player.isMember ? (
                    <Badge variant="default" className="text-xs">Membre</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">Non membre</Badge>
                  )}
                  {player.isMember && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeMembership(player)}
                      disabled={removingId === player.id}
                      title="Retirer de la communauté"
                    >
                      {removingId === player.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <UserMinus className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
