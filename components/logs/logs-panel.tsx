"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { format, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { ClipboardList, Users, Shield, Calendar, Megaphone, Star, UserPlus, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserSearchInput, type SelectedUser } from "@/components/moderation/user-search-input"

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
  if (action.startsWith("COMMUNITY")) return <Shield className="h-4 w-4" />
  if (action.startsWith("MEMBER")) return <Users className="h-4 w-4" />
  if (action.startsWith("APPLICATION")) return <UserPlus className="h-4 w-4" />
  if (action.startsWith("EVENT")) return <Calendar className="h-4 w-4" />
  if (action.startsWith("MODERATION")) return <AlertTriangle className="h-4 w-4" />
  if (action.startsWith("POST")) return <Megaphone className="h-4 w-4" />
  if (action.startsWith("NEXUS")) return <Star className="h-4 w-4" />
  return <ClipboardList className="h-4 w-4" />
}

function getActionIconBg(action: string) {
  if (action.startsWith("COMMUNITY")) return "bg-indigo-500/15 text-indigo-500"
  if (action.startsWith("MEMBER")) return "bg-blue-500/15 text-blue-500"
  if (action.startsWith("APPLICATION")) return "bg-green-500/15 text-green-500"
  if (action.startsWith("EVENT")) return "bg-orange-500/15 text-orange-500"
  if (action.startsWith("MODERATION")) return "bg-red-500/15 text-red-500"
  if (action.startsWith("POST")) return "bg-purple-500/15 text-purple-500"
  if (action.startsWith("NEXUS")) return "bg-yellow-500/15 text-yellow-500"
  return "bg-muted text-muted-foreground"
}

function getUserName(u: { name: string | null; steamName: string | null } | null) {
  if (!u) return "Système"
  return u.steamName ?? u.name ?? "Inconnu"
}

function getUserAvatar(u: { steamAvatar?: string | null; customAvatar?: string | null; image?: string | null } | null) {
  if (!u) return undefined
  return u.customAvatar ?? u.steamAvatar ?? u.image ?? undefined
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  if (date >= todayStart) return "Aujourd'hui"
  if (date >= yesterdayStart) return "Hier"
  return format(date, "d MMMM yyyy", { locale: fr })
}

export function LogsPanel({ mode, communitySlug }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterActor, setFilterActor] = useState<SelectedUser | null>(null)
  const [filterTarget, setFilterTarget] = useState<SelectedUser | null>(null)

  const apiBase = mode === "nexus" ? "/api/logs" : `/api/communities/${communitySlug}/logs`

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (filterCategory !== "all") params.set("action", filterCategory)
      if (filterActor) params.set("actorId", filterActor.id)
      if (filterTarget) params.set("targetId", filterTarget.id)
      const res = await fetch(`${apiBase}?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
      setPage(data.page)
      setTotalPages(data.totalPages)
    } catch {
      toast.error("Erreur lors du chargement des logs")
    } finally {
      setLoading(false)
    }
  }, [apiBase, filterCategory, filterActor, filterTarget])

  useEffect(() => {
    fetchLogs(1)
  }, [fetchLogs])

  const categoryOptions = mode === "community"
    ? ACTION_CATEGORIES.filter((c) => c.value !== "NEXUS" && c.value !== "COMMUNITY")
    : ACTION_CATEGORIES

  // Grouper par date
  const dateGroups: { label: string; items: AuditLog[] }[] = []
  for (const log of logs) {
    const label = getDateLabel(log.createdAt)
    const last = dateGroups[dateGroups.length - 1]
    if (last && last.label === label) last.items.push(log)
    else dateGroups.push({ label, items: [log] })
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 text-xs w-auto min-w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="w-48">
          <UserSearchInput
            value={filterActor}
            onChange={setFilterActor}
            placeholder="Acteur..."
            forMod={true}
          />
        </div>
        <div className="w-48">
          <UserSearchInput
            value={filterTarget}
            onChange={setFilterTarget}
            placeholder="Cible..."
            forMod={true}
          />
        </div>
        <p className="text-sm text-muted-foreground ml-auto">
          {total > 0 ? `${total} entrée${total > 1 ? "s" : ""}` : "Aucune entrée"}
        </p>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Chargement...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun log trouvé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dateGroups.map(({ label, items }) => (
            <div key={label}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{label}</p>
              <div className="divide-y divide-border/50 rounded-lg border overflow-hidden">
                {items.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                    {/* Icône catégorie */}
                    <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${getActionIconBg(log.action)}`}>
                      {getActionIcon(log.action)}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {log.actor && (
                            <Avatar className="h-5 w-5 shrink-0">
                              <AvatarImage src={getUserAvatar(log.actor)} />
                              <AvatarFallback className="text-[9px]">{getUserName(log.actor)[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                          )}
                          <p className="text-sm leading-snug">
                            <span className="font-medium">{getUserName(log.actor)}</span>
                            {log.target && log.target.id !== log.actor?.id && (
                              <span className="text-muted-foreground"> → <span className="font-medium text-foreground">{getUserName(log.target)}</span></span>
                            )}
                            {mode === "nexus" && log.community && (
                              <span className="text-muted-foreground"> dans {log.community.name}</span>
                            )}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchLogs(page - 1)}>Précédent</Button>
              <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchLogs(page + 1)}>Suivant</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
