"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type DbStatus = "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED"

const STATUS_LABELS: Record<DbStatus, string> = {
  DRAFT:     "Brouillon",
  PUBLISHED: "Publié",
  ONGOING:   "Publié",
  COMPLETED: "Publié",
  CANCELLED: "Annulé",
}

interface Props {
  communitySlug: string
  eventId: string
  currentStatus: DbStatus
}

export function EventCardStatusDropdown({ communitySlug, eventId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleChange(newStatus: string) {
    if (newStatus === currentStatus) return
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data.error as string) ?? "Erreur")
      }
      toast.success(newStatus === "PUBLISHED" ? "Événement publié" : newStatus === "DRAFT" ? "Repassé en brouillon" : "Statut mis à jour")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  // Afficher la valeur normalisée (ONGOING/COMPLETED → "Publié")
  const displayValue = currentStatus === "CANCELLED" ? "CANCELLED"
    : currentStatus === "DRAFT" ? "DRAFT"
    : "PUBLISHED"

  return (
    <div onClick={(e) => e.preventDefault()}>
      <Select value={displayValue} onValueChange={handleChange} disabled={loading}>
        <SelectTrigger className="h-7 text-xs w-32">
          <SelectValue>{STATUS_LABELS[currentStatus]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {currentStatus === "CANCELLED" ? (
            <>
              <SelectItem value="PUBLISHED">Republier</SelectItem>
              <SelectItem value="DRAFT">Rouvrir en brouillon</SelectItem>
            </>
          ) : (
            <>
              <SelectItem value="DRAFT">Brouillon</SelectItem>
              <SelectItem value="PUBLISHED">Publié</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
