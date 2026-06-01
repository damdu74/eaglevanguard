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
import { MoreHorizontal, Star, UserMinus } from "lucide-react"

interface Props {
  communitySlug: string
  userId: string
  currentRankId: string | null
  ranks: { id: string; name: string; isPermanent: boolean }[]
}

export function MemberActions({
  communitySlug,
  userId,
  currentRankId,
  ranks,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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

  const availableRanks = ranks.filter((r) => !r.isPermanent)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        {availableRanks.length > 0 && (
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
                Aucun grade{currentRankId === null && " ✓"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {availableRanks.map((rank) => (
                <DropdownMenuItem
                  key={rank.id}
                  disabled={rank.id === currentRankId}
                  onClick={() => patch({ rankId: rank.id })}
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
