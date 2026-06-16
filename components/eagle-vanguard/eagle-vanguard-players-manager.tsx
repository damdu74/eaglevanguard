"use client"

import { useRouter, usePathname } from "next/navigation"
import { useCallback, useTransition, useState } from "react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Shield, Users, UserMinus, Loader2 } from "lucide-react"
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
  isEagleVanguardTeam: boolean
  isMember: boolean
  _count: { memberships: number }
}

interface Props {
  staff: Player[]
  members: Player[]
  initialQuery: string
}

function PlayerRow({ player, onRemove, removingId }: {
  player: Player
  onRemove?: (player: Player) => void
  removingId: string | null
}) {
  const displayName = player.steamName ?? player.discordName ?? player.name ?? "Joueur"
  const avatar = player.customAvatar ?? player.steamAvatar ?? player.discordAvatar ?? player.image

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t first:border-t-0">
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
        {player.isMember && onRemove && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(player)}
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
}

export function EagleVanguardPlayersManager({ staff, members: initialMembers, initialQuery }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [members, setMembers] = useState<Player[]>(initialMembers)
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
      setMembers(prev => prev.map(p => p.id === player.id ? { ...p, isMember: false, _count: { memberships: 0 } } : p))
      toast.success(`${name} a été retiré de la communauté`)
    } catch {
      toast.error("Erreur lors du retrait")
    } finally {
      setRemovingId(null)
    }
  }

  const total = staff.length + members.length

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          defaultValue={initialQuery}
          onChange={handleSearch}
          placeholder="Rechercher…"
          className="pl-9"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {initialQuery.length >= 2
          ? `${total} résultat${total > 1 ? "s" : ""} pour « ${initialQuery} »`
          : `${total} utilisateur${total > 1 ? "s" : ""}`}
      </p>

      {/* Staff */}
      {staff.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4 text-indigo-400" />
              Equipe Eagle Vanguard ({staff.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {staff.map(player => (
              <PlayerRow key={player.id} player={player} removingId={removingId} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Membres */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-blue-400" />
            Membres ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {members.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground border-t">
              {initialQuery.length >= 2 ? "Aucun membre trouvé" : "Aucun membre inscrit"}
            </p>
          ) : (
            members.map(player => (
              <PlayerRow key={player.id} player={player} onRemove={removeMembership} removingId={removingId} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
