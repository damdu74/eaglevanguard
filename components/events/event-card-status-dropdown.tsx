"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Props {
  communitySlug: string
  eventId: string
  currentStatus: "DRAFT" | "PUBLISHED"
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
      toast.success(newStatus === "PUBLISHED" ? "Événement publié" : "Repassé en brouillon")
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
          <SelectItem value="DRAFT">Brouillon</SelectItem>
          <SelectItem value="PUBLISHED">Publié</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
