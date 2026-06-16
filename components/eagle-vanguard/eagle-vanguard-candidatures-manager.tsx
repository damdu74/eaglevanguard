"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, ChevronDown, ChevronUp, Loader2, Users } from "lucide-react"
import { toast } from "sonner"

interface Application {
  id: string
  status: string
  message: string | null
  createdAt: string
  user: {
    id: string
    steamName: string | null
    discordName: string | null
    name: string | null
    steamAvatar: string | null
    discordAvatar: string | null
    image: string | null
  }
}

interface Props {
  applications: Application[]
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
}
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  ACCEPTED: "default",
  REJECTED: "destructive",
}

function ApplicationRow({ app }: { app: Application }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState<"ACCEPTED" | "REJECTED" | null>(null)

  const displayName = app.user.steamName ?? app.user.discordName ?? app.user.name ?? "Joueur"
  const avatar = app.user.steamAvatar ?? app.user.discordAvatar ?? app.user.image

  async function handle(action: "ACCEPTED" | "REJECTED") {
    setLoading(action)
    try {
      const res = await fetch(`/api/eagle-vanguard/candidatures/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, response }),
      })
      if (!res.ok) throw new Error()
      toast.success(action === "ACCEPTED" ? `${displayName} a été accepté` : `${displayName} a été refusé`)
      router.refresh()
    } catch {
      toast.error("Une erreur est survenue")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="border-t first:border-t-0">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={avatar ?? undefined} />
            <AvatarFallback className="text-xs">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground">{new Date(app.createdAt).toLocaleDateString("fr-FR")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={STATUS_VARIANTS[app.status]}>{STATUS_LABELS[app.status] ?? app.status}</Badge>
          {app.status === "PENDING" && (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setExpanded(v => !v)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {expanded && app.status === "PENDING" && (
        <div className="px-4 pb-4 space-y-3 bg-muted/30">
          {app.message && (
            <div className="rounded-md border bg-background px-3 py-2 text-sm">
              <p className="text-xs text-muted-foreground mb-1">Motivation</p>
              <p>{app.message}</p>
            </div>
          )}
          <Textarea
            placeholder="Réponse au candidat (optionnel)…"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => handle("ACCEPTED")}
              disabled={!!loading}
            >
              {loading === "ACCEPTED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
              Accepter
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => handle("REJECTED")}
              disabled={!!loading}
            >
              {loading === "REJECTED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5 mr-1.5" />}
              Refuser
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function EagleVanguardCandidaturesManager({ applications }: Props) {
  const pending = applications.filter(a => a.status === "PENDING")
  const processed = applications.filter(a => a.status !== "PENDING")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-orange-400" />
            En attente ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {pending.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground border-t">Aucune candidature en attente.</p>
          ) : (
            pending.map(app => <ApplicationRow key={app.id} app={app} />)
          )}
        </CardContent>
      </Card>

      {processed.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-muted-foreground" />
              Traitées ({processed.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {processed.map(app => <ApplicationRow key={app.id} app={app} />)}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
