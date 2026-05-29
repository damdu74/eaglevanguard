"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Status = "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED"

const STATUS_LABELS: Record<Status, string> = {
  DRAFT:     "Brouillon",
  PUBLISHED: "Publié",
  ONGOING:   "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
}

const VALID_TRANSITIONS: Record<Status, Status[]> = {
  DRAFT:     ["PUBLISHED", "CANCELLED"],
  PUBLISHED: ["DRAFT", "ONGOING", "CANCELLED"],
  ONGOING:   ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: ["DRAFT"],
}

interface Props {
  communitySlug: string
  eventId: string
  currentStatus: Status
}

export function EventCardStatusDropdown({ communitySlug, eventId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const options = VALID_TRANSITIONS[currentStatus] ?? []
  if (options.length === 0) return null

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
      toast.success(`Statut : ${STATUS_LABELS[newStatus as Status]}`)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onClick={(e) => e.preventDefault()}>
      <Select value={currentStatus} onValueChange={handleChange} disabled={loading}>
        <SelectTrigger className="h-7 text-xs w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={currentStatus}>{STATUS_LABELS[currentStatus]}</SelectItem>
          {options.map((s) => (
            <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
