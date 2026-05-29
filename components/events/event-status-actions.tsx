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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Send, Play, CheckCircle, XCircle, RotateCcw } from "lucide-react"

type Status = "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED" | "ARCHIVED"

const TRANSITIONS: Record<Status, { status: Status; label: string; icon: React.ElementType; variant?: "destructive" }[]> = {
  DRAFT: [
    { status: "PUBLISHED", label: "Publier", icon: Send },
    { status: "CANCELLED", label: "Annuler", icon: XCircle, variant: "destructive" },
  ],
  PUBLISHED: [
    { status: "ONGOING", label: "Démarrer", icon: Play },
    { status: "DRAFT", label: "Repasser en brouillon", icon: RotateCcw },
    { status: "CANCELLED", label: "Annuler", icon: XCircle, variant: "destructive" },
  ],
  ONGOING: [
    { status: "COMPLETED", label: "Terminer", icon: CheckCircle },
    { status: "CANCELLED", label: "Annuler", icon: XCircle, variant: "destructive" },
  ],
  COMPLETED: [],
  CANCELLED: [
    { status: "PUBLISHED", label: "Republier", icon: Send },
    { status: "DRAFT", label: "Rouvrir en brouillon", icon: RotateCcw },
  ],
  ARCHIVED: [],
}

const STATUS_LABELS: Record<Status, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ONGOING: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  ARCHIVED: "Archivé",
}

interface Props {
  communitySlug: string
  eventId: string
  currentStatus: Status
}

export function EventStatusActions({ communitySlug, eventId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const transitions = TRANSITIONS[currentStatus] ?? []
  if (transitions.length === 0) return null

  async function changeStatus(newStatus: Status) {
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Erreur")
      }
      toast.success(`Statut mis à jour : ${STATUS_LABELS[newStatus]}`)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  if (transitions.length === 1) {
    const t = transitions[0]
    const Icon = t.icon
    return (
      <Button
        variant={t.variant === "destructive" ? "destructive" : "outline"}
        size="sm"
        disabled={loading}
        onClick={() => changeStatus(t.status)}
        className="gap-2"
      >
        <Icon className="h-4 w-4" />
        {t.label}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading} className="gap-2">
          Changer le statut
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Statut actuel : {STATUS_LABELS[currentStatus]}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {transitions.map((t) => {
          const Icon = t.icon
          return (
            <DropdownMenuItem
              key={t.status}
              onClick={() => changeStatus(t.status)}
              className={t.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}
            >
              <Icon className="mr-2 h-4 w-4" />
              {t.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
