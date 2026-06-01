"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { AlertTriangle, Ban, UserX, RotateCcw, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type ActionType = "WARN" | "KICK" | "BAN_COMMUNITY" | "BAN_PLATFORM" | "UNBAN"

interface Sanction {
  id: string
  type: ActionType
  reason: string
  createdAt: string
  expiresAt: string | null
  resolvedAt: string | null
  moderator: { id: string; name: string | null; steamName: string | null }
  community: { id: string; name: string; slug: string } | null
}

const ACTION_LABELS: Record<ActionType, string> = {
  WARN: "Avertissement",
  KICK: "Expulsion",
  BAN_COMMUNITY: "Ban communauté",
  BAN_PLATFORM: "Ban plateforme",
  UNBAN: "Levée de sanction",
}

const ACTION_COLORS: Record<ActionType, string> = {
  WARN: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  KICK: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  BAN_COMMUNITY: "bg-red-500/15 text-red-600 border-red-500/30",
  BAN_PLATFORM: "bg-red-700/15 text-red-700 border-red-700/30",
  UNBAN: "bg-green-500/15 text-green-600 border-green-500/30",
}

const ACTION_ICONS: Record<ActionType, React.ReactNode> = {
  WARN: <AlertTriangle className="h-3.5 w-3.5" />,
  KICK: <UserX className="h-3.5 w-3.5" />,
  BAN_COMMUNITY: <Ban className="h-3.5 w-3.5" />,
  BAN_PLATFORM: <Ban className="h-3.5 w-3.5" />,
  UNBAN: <RotateCcw className="h-3.5 w-3.5" />,
}

function getModeratorName(m: { name: string | null; steamName: string | null }) {
  return m.steamName ?? m.name ?? "Staff"
}

export function MySanctions() {
  const [sanctions, setSanctions] = useState<Sanction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/me/moderation")
      .then((r) => r.json())
      .then(setSanctions)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Mes sanctions
        </CardTitle>
        <CardDescription>Historique des actions de modération vous concernant.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : sanctions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune sanction enregistrée.</p>
        ) : (
          <ul className="space-y-3">
            {sanctions.map((s) => (
              <li key={s.id} className={`rounded-lg border p-3 ${s.resolvedAt ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${ACTION_COLORS[s.type]}`}>
                    {ACTION_ICONS[s.type]}
                    {ACTION_LABELS[s.type]}
                  </span>
                  {s.community && (
                    <span className="text-xs text-muted-foreground">
                      dans <span className="font-medium">{s.community.name}</span>
                    </span>
                  )}
                  {s.resolvedAt && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                      Résolu
                    </span>
                  )}
                </div>
                <p className="text-sm">{s.reason}</p>
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span>Par <span className="font-medium">{getModeratorName(s.moderator)}</span></span>
                  <span>{format(new Date(s.createdAt), "d MMM yyyy à HH:mm", { locale: fr })}</span>
                  {s.expiresAt && (
                    <span>Expire le {format(new Date(s.expiresAt), "d MMM yyyy", { locale: fr })}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
