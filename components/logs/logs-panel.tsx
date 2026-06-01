"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ClipboardList, Search, Users, Shield, Calendar, Megaphone, Star, UserPlus, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface AuditLog {
  id: string
  action: string
  description: string
  createdAt: string
  actor: { id: string; name: string | null; steamName: string | null; steamAvatar: string | null; customAvatar: string | null; image: string | null } | null
  target: { id: string; name: string | null; steamName: string | null } | null
  community?: { id: string; name: string; slug: string; logoUrl: string | null } | null
  metadata: Record<string, unknown> | null
}

interface Props {
  mode: "nexus" | "community"
  communitySlug?: string
  communityName?: string
}

const ACTION_CATEGORIES = [
  { value: "all", label: "Toutes les actions" },
  { value: "COMMUNITY", label: "Communautés" },
  { value: "MEMBER", label: "Membres" },
  { value: "APPLICATION", label: "Candidatures" },
  { value: "EVENT", label: "Événements" },
  { value: "MODERATION", label: "Modération" },
  { value: "POST", label: "Annonces" },
  { value: "NEXUS", label: "NEXUS Team" },
]

function getActionIcon(action: string) {
  if (action.startsWith("COMMUNITY")) return <Shield className="h-3.5 w-3.5 text-indigo-500" />
  if (action.startsWith("MEMBER")) return <Users className="h-3.5 w-3.5 text-blue-500" />
  if (action.startsWith("APPLICATION")) return <UserPlus className="h-3.5 w-3.5 text-green-500" />
  if (action.startsWith("EVENT")) return <Calendar className="h-3.5 w-3.5 text-orange-500" />
  if (action.startsWith("MODERATION")) return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
  if (action.startsWith("POST")) return <Megaphone className="h-3.5 w-3.5 text-purple-500" />
  if (action.startsWith("NEXUS")) return <Star className="h-3.5 w-3.5 text-yellow-500" />
  return <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
}

function getActionColor(action: string) {
  if (action.startsWith("COMMUNITY")) return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
  if (action.startsWith("MEMBER")) return "bg-blue-500/10 text-blue-600 border-blue-500/20"
  if (action.startsWith("APPLICATION")) return "bg-green-500/10 text-green-600 border-green-500/20"
  if (action.startsWith("EVENT")) return "bg-orange-500/10 text-orange-600 border-orange-500/20"
  if (action.startsWith("MODERATION")) return "bg-red-500/10 text-red-600 border-red-500/20"
  if (action.startsWith("POST")) return "bg-purple-500/10 text-purple-600 border-purple-500/20"
  if (action.startsWith("NEXUS")) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
  return "bg-muted text-muted-foreground border-border"
}

function formatAction(action: string) {
  return action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

function getUserName(u: { name: string | null; steamName: string | null } | null) {
  if (!u) return "Système"
  return u.steamName ?? u.name ?? "Inconnu"
}

function getUserAvatar(u: { steamAvatar?: string | null; customAvatar?: string | null; image?: string | null } | null) {
  if (!u) return undefined
  return u.customAvatar ?? u.steamAvatar ?? u.image ?? undefined
}

export function LogsPanel({ mode, communitySlug }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [filterCategory, setFilterCategory] = useState("all")

  const apiBase = mode === "nexus" ? "/api/logs" : `/api/communities/${communitySlug}/logs`

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (filterCategory !== "all") params.set("action", filterCategory)
      const res = await fetch(`${apiBase}?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
      setPage(data.page)
      setTotalPages(data.totalPages)
      setLoaded(true)
    } catch {
      toast.error("Erreur lors du chargement des logs")
    } finally {
      setLoading(false)
    }
  }, [apiBase, filterCategory])

  const categoryOptions = mode === "community"
    ? ACTION_CATEGORIES.filter((c) => c.value !== "NEXUS" && c.value !== "COMMUNITY")
    : ACTION_CATEGORIES

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs mb-1 block">Catégorie</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="h-9" onClick={() => fetchLogs(1)} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Charger
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste */}
      {!loaded ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Cliquez sur &quot;Charger&quot; pour afficher les logs</p>
        </div>
      ) : loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Chargement...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Aucun log trouvé</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{total} entrée{total > 1 ? "s" : ""}</p>

          {logs.map((log) => (
            <Card key={log.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  {/* Avatar acteur */}
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={getUserAvatar(log.actor)} />
                    <AvatarFallback className="text-xs">{getUserName(log.actor)[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      {/* Badge action */}
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                        {formatAction(log.action)}
                      </span>
                      {/* Communauté (mode nexus uniquement) */}
                      {mode === "nexus" && log.community && (
                        <span className="text-xs text-muted-foreground">
                          dans <span className="font-medium">{log.community.name}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-sm">{log.description}</p>

                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span>
                        Par <span className="font-medium">{getUserName(log.actor)}</span>
                      </span>
                      {log.target && (
                        <span>
                          → <span className="font-medium">{getUserName(log.target)}</span>
                        </span>
                      )}
                      <span>{format(new Date(log.createdAt), "d MMM yyyy à HH:mm", { locale: fr })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchLogs(page - 1)}>
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchLogs(page + 1)}>
                Suivant
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
