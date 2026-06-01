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
import { ROLE_LABELS } from "@/lib/permissions"

interface CommunityRole {
  id: string
  name: string
  color: string
}

interface Props {
  communitySlug: string
  userId: string
  currentRole: string
  currentCommunityRoleId: string | null
  currentRankId: string | null
  ranks: { id: string; name: string; isPermanent: boolean }[]
  communityRoles: CommunityRole[]
  myRole: string
}

export function MemberActions({
  communitySlug,
  userId,
  currentRole,
  currentCommunityRoleId,
  currentRankId,
  ranks,
  communityRoles,
  myRole,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isOwner = myRole === "OWNER"

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
      const res = await fetch(`/api/communities/${communitySlug}/members/${userId}`, { method: "DELETE" })
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

        {/* Rôles personnalisés (OWNER uniquement) */}
        {isOwner && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Shield className="mr-2 h-4 w-4" />
              Assigner un rôle
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                disabled={currentCommunityRoleId === null && currentRole === "MEMBER"}
                onClick={() => patch({ role: "MEMBER", communityRoleId: null })}
              >
                {ROLE_LABELS.MEMBER}
                {currentCommunityRoleId === null && currentRole === "MEMBER" && " ✓"}
              </DropdownMenuItem>
              {communityRoles.length > 0 && <DropdownMenuSeparator />}
              {communityRoles.map((role) => (
                <DropdownMenuItem
                  key={role.id}
                  disabled={currentCommunityRoleId === role.id}
                  onClick={() => patch({ role: "MEMBER", communityRoleId: role.id })}
                >
                  <span className="mr-2 h-2 w-2 rounded-full inline-block shrink-0" style={{ backgroundColor: role.color }} />
                  {role.name}
                  {currentCommunityRoleId === role.id && " ✓"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {/* Grades */}
        {ranks.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Star className="mr-2 h-4 w-4" />
              Attribuer un grade
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem disabled={currentRankId === null} onClick={() => patch({ rankId: null })}>
                Aucun grade{currentRankId === null && " ✓"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {ranks
                .filter((rank) => !rank.isPermanent || rank.id === currentRankId)
                .map((rank) => (
                  <DropdownMenuItem
                    key={rank.id}
                    disabled={rank.id === currentRankId || rank.isPermanent}
                    onClick={() => !rank.isPermanent && patch({ rankId: rank.id })}
                  >
                    {rank.name}{rank.id === currentRankId && " ✓"}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={kick}>
          <UserMinus className="mr-2 h-4 w-4" />
          Exclure de la communauté
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
