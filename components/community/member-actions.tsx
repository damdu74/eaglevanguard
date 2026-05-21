"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Shield, Star, UserMinus } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MODERATOR: "Modérateur",
  MEMBER: "Membre",
  RECRUIT: "Nouveau",
}

interface Props {
  communitySlug: string
  userId: string
  currentRole: string
  currentRankId: string | null
  ranks: { id: string; name: string; abbreviation: string }[]
  myRole: string
}

export function MemberActions({
  communitySlug,
  userId,
  currentRole,
  currentRankId,
  ranks,
  myRole,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const availableRoles = (() => {
    if (myRole === "OWNER") return ["ADMIN", "MODERATOR", "MEMBER"]
    if (myRole === "ADMIN") return ["MODERATOR", "MEMBER"]
    return ["MEMBER"]
  })()

  async function patch(body: object) {
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Erreur")
      }
      toast.success("Membre mis à jour")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  async function kick() {
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/members/${userId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Erreur")
      }
      toast.success("Membre exclu")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Shield className="mr-2 h-4 w-4" />
            Changer le rôle
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {availableRoles.map((role) => (
              <DropdownMenuItem
                key={role}
                disabled={role === currentRole}
                onClick={() => patch({ role })}
              >
                {ROLE_LABELS[role]}
                {role === currentRole && " ✓"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {ranks.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Star className="mr-2 h-4 w-4" />
              Attribuer un grade
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                disabled={currentRankId === null}
                onClick={() => patch({ rankId: null })}
              >
                Aucun grade
                {currentRankId === null && " ✓"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {ranks.map((rank) => (
                <DropdownMenuItem
                  key={rank.id}
                  disabled={rank.id === currentRankId}
                  onClick={() => patch({ rankId: rank.id })}
                >
                  [{rank.abbreviation}] {rank.name}
                  {rank.id === currentRankId && " ✓"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={kick}
        >
          <UserMinus className="mr-2 h-4 w-4" />
          Exclure de la communauté
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
