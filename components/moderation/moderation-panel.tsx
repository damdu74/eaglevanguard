"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { format, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Shield, AlertTriangle, Ban, UserX, RotateCcw, Trash2, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { UserSearchInput, type SelectedUser } from "@/components/moderation/user-search-input"
import { LogsPanel } from "@/components/logs/logs-panel"

type ActionType = "WARN" | "KICK" | "BAN_COMMUNITY" | "BAN_PLATFORM" | "UNBAN"

interface ModerationAction {
  id: string
  type: ActionType
  reason: string
  note: string | null
  createdAt: string
  expiresAt: string | null
  resolvedAt: string | null
  target: { id: string; name: string | null; steamName: string | null; steamAvatar: string | null; customAvatar: string | null; image: string | null }
  moderator: { id: string; name: string | null; steamName: string | null; image: string | null; steamAvatar: string | null; customAvatar: string | null }
  community?: { id: string; name: string; slug: string; logoUrl: string | null } | null
  resolvedBy: { id: string; name: string | null; steamName: string | null } | null
}

interface Props {
  mode: "nexus" | "community"
  communitySlug?: string
  communityName?: string
  isNexusTeam: boolean
  showLogs?: boolean
}

const ACTION_LABELS: Record<ActionType, string> = {
  WARN: "Avertissement",
  KICK: "Expulsion",
  BAN_COMMUNITY: "Ban communauté",
  BAN_PLATFORM: "Ban plateforme",
  UNBAN: "Levée de sanction",
}

const ACTION_VERBS: Record<ActionType, string> = {
  WARN: "a averti",
  KICK: "a expulsé",
  BAN_COMMUNITY: "a banni",
  BAN_PLATFORM: "a banni définitivement",
  UNBAN: "a levé le ban de",
}

const ACTION_ICON_BG: Record<ActionType, string> = {
  WARN: "bg-yellow-500/15 text-yellow-500",
  KICK: "bg-orange-500/15 text-orange-500",
  BAN_COMMUNITY: "bg-red-500/15 text-red-500",
  BAN_PLATFORM: "bg-red-700/15 text-red-600",
  UNBAN: "bg-green-500/15 text-green-500",
}

const ACTION_ICONS: Record<ActionType, React.ReactNode> = {
  WARN: <AlertTriangle className="h-4 w-4" />,
  KICK: <UserX className="h-4 w-4" />,
  BAN_COMMUNITY: <Ban className="h-4 w-4" />,
  BAN_PLATFORM: <Ban className="h-4 w-4" />,
  UNBAN: <RotateCcw className="h-4 w-4" />,
}

function getUserDisplayName(u: { name: string | null; steamName: string | null }) {
  return u.steamName ?? u.name ?? "Utilisateur"
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

export function ModerationPanel({ mode, communitySlug, communityName, isNexusTeam, showLogs = false }: Props) {
  const [actions, setActions] = useState<ModerationAction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [filterType, setFilterType] = useState<string>("all")
  const [filterTargetUser, setFilterTargetUser] = useState<SelectedUser | null>(null)
  const [filterModeratorUser, setFilterModeratorUser] = useState<SelectedUser | null>(null)
  const [staffList, setStaffList] = useState<SelectedUser[]>([])

  useEffect(() => {
    if (mode !== "nexus") return
    fetch("/api/nexus/members")
      .then((r) => r.json())
      .then((members: Array<{ id: string; steamName: string | null; discordName: string | null; name: string | null }>) => {
        setStaffList(members.map((m) => ({
          id: m.id,
          displayName: m.steamName ?? m.discordName ?? m.name ?? "Membre",
        })))
      })
      .catch(() => {})
  }, [mode])

  const [resolveAction, setResolveAction] = useState<ModerationAction | null>(null)
  const [resolveNote, setResolveNote] = useState("")
  const [resolving, setResolving] = useState(false)

  const apiBase = mode === "nexus" ? "/api/moderation" : `/api/communities/${communitySlug}/moderation`

  const fetchActions = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (filterType !== "all") params.set("type", filterType)
      if (filterTargetUser) params.set("targetId", filterTargetUser.id)
      if (filterModeratorUser) params.set("moderatorId", filterModeratorUser.id)
      const res = await fetch(`${apiBase}?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setActions(data.actions)
      setTotal(data.total)
      setPage(data.page)
      setTotalPages(data.totalPages)
    } catch {
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }, [apiBase, filterType, filterTargetUser, filterModeratorUser])

  useEffect(() => {
    fetchActions(1)
  }, [fetchActions])

  const availableTypes: ActionType[] = mode === "nexus"
    ? ["WARN", "KICK", "BAN_COMMUNITY", "BAN_PLATFORM", "UNBAN"]
    : ["WARN", "KICK", "BAN_COMMUNITY", "UNBAN"]

  async function handleResolve() {
    if (!resolveAction) return
    setResolving(true)
    try {
      const res = await fetch(`${apiBase}/${resolveAction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: resolveNote || undefined }),
      })
      if (!res.ok) throw new Error()
      toast.success("Action résolue")
      setResolveAction(null)
      setResolveNote("")
      fetchActions(page)
    } catch {
      toast.error("Erreur lors de la résolution")
    } finally {
      setResolving(false)
    }
  }

  async function handleDelete(actionId: string) {
    if (!confirm("Supprimer définitivement cette action ?")) return
    try {
      const res = await fetch(`${apiBase}/${actionId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Action supprimée")
      fetchActions(page)
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  // Grouper par date
  const dateGroups: { label: string; items: ModerationAction[] }[] = []
  for (const action of actions) {
    const label = getDateLabel(action.createdAt)
    const last = dateGroups[dateGroups.length - 1]
    if (last && last.label === label) last.items.push(action)
    else dateGroups.push({ label, items: [action] })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Historique des sanctions{communityName ? ` — ${communityName}` : ""}
        </h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          {total > 0 ? `${total} action${total > 1 ? "s" : ""}` : "Aucune action enregistrée"}
        </p>
      </div>

      {/* Filtres compacts */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-8 text-xs w-auto min-w-[140px]">
            <SelectValue placeholder="Type d'action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {availableTypes.map((t) => (
              <SelectItem key={t} value={t}>{ACTION_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="w-44">
          <UserSearchInput
            value={filterTargetUser}
            onChange={setFilterTargetUser}
            placeholder="Cible..."
            forMod={mode === "nexus"}
          />
        </div>

        {mode === "nexus" ? (
          <Select
            value={filterModeratorUser?.id ?? "all"}
            onValueChange={(v) => setFilterModeratorUser(v === "all" ? null : (staffList.find((s) => s.id === v) ?? null))}
          >
            <SelectTrigger className="h-8 text-xs w-auto min-w-[150px]">
              <SelectValue placeholder="Modérateur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les modérateurs</SelectItem>
              {staffList.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.displayName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="w-44">
            <UserSearchInput
              value={filterModeratorUser}
              onChange={setFilterModeratorUser}
              placeholder="Modérateur..."
              forMod={false}
            />
          </div>
        )}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Chargement...</div>
      ) : actions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucune action de modération</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dateGroups.map(({ label, items }) => (
            <div key={label}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{label}</p>
              <div className="divide-y divide-border/50 rounded-lg border overflow-hidden">
                {items.map((action) => (
                  <div
                    key={action.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group ${action.resolvedAt ? "opacity-50" : ""}`}
                  >
                    {/* Icône action */}
                    <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${ACTION_ICON_BG[action.type]}`}>
                      {ACTION_ICONS[action.type]}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm leading-snug">
                          <span className="font-medium">{getUserDisplayName(action.moderator)}</span>
                          {" "}<span className="text-muted-foreground">{ACTION_VERBS[action.type]}</span>{" "}
                          <span className="font-medium">{getUserDisplayName(action.target)}</span>
                          {action.community && mode === "nexus" && (
                            <span className="text-muted-foreground"> dans {action.community.name}</span>
                          )}
                          {action.resolvedAt && (
                            <span className="ml-2 text-xs text-green-500 font-normal">· résolu</span>
                          )}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                          {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.reason}</p>
                      {action.note && (
                        <p className="text-xs text-muted-foreground/60 mt-0.5 italic">{action.note}</p>
                      )}
                      {action.expiresAt && (
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          Expire le {format(new Date(action.expiresAt), "d MMM yyyy", { locale: fr })}
                        </p>
                      )}
                    </div>

                    {/* Actions au hover */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                      {!action.resolvedAt && (
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => { setResolveAction(action); setResolveNote("") }}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Résoudre
                        </Button>
                      )}
                      {(!action.resolvedAt || isNexusTeam) && (
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(action.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchActions(page - 1)}>Précédent</Button>
              <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchActions(page + 1)}>Suivant</Button>
            </div>
          )}
        </div>
      )}

      {/* Section Logs intégrée */}
      {showLogs && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <ClipboardList className="h-5 w-5" />
              Logs d&apos;activité
            </h2>
            <LogsPanel mode={mode} communitySlug={communitySlug} />
          </div>
        </>
      )}

      {/* Dialog résolution */}
      <Dialog open={!!resolveAction} onOpenChange={(o) => !o && setResolveAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Résoudre l&apos;action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {resolveAction && (
              <p className="text-sm text-muted-foreground">
                Marquer comme résolue l&apos;action <span className="font-medium">{ACTION_LABELS[resolveAction.type]}</span> sur{" "}
                <span className="font-medium">{getUserDisplayName(resolveAction.target)}</span>.
              </p>
            )}
            <div>
              <Label>Note de résolution <span className="text-muted-foreground text-xs">(optionnelle)</span></Label>
              <Textarea
                className="mt-1 resize-none"
                rows={2}
                placeholder="Ex : sanction levée après discussion..."
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                maxLength={500}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResolveAction(null)}>Annuler</Button>
              <Button onClick={handleResolve} disabled={resolving}>
                {resolving ? "Résolution..." : "Marquer résolue"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
