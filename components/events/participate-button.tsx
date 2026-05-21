"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Check } from "lucide-react"

interface ParticipateButtonProps {
  communitySlug: string
  eventId: string
  currentStatus: "CONFIRMED" | "TENTATIVE" | "DECLINED" | null
  isMember: boolean
}

const OPTIONS = [
  { value: "CONFIRMED", label: "Présent" },
  { value: "TENTATIVE", label: "Peut-être" },
  { value: "DECLINED", label: "Absent" },
] as const

export function ParticipateButton({ communitySlug, eventId, currentStatus, isMember }: ParticipateButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)

  if (!isMember) {
    return (
      <Button variant="outline" disabled>
        Rejoignez la communauté pour participer
      </Button>
    )
  }

  const updateStatus = async (newStatus: "CONFIRMED" | "TENTATIVE" | "DECLINED") => {
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/events/${eventId}/participate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error((json.error as string) ?? "Erreur")
      setStatus(newStatus)
      toast.success(OPTIONS.find((o) => o.value === newStatus)?.label ?? newStatus)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const currentLabel = OPTIONS.find((o) => o.value === status)?.label ?? "S'inscrire"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={status ? "secondary" : "default"} disabled={loading}>
          {currentLabel}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => updateStatus(opt.value)}
            className="flex items-center gap-2"
          >
            {status === opt.value && <Check className="h-4 w-4" />}
            {status !== opt.value && <span className="h-4 w-4" />}
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
