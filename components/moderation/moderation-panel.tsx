"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Shield, AlertTriangle, Ban, UserX, ChevronDown, Plus, RotateCcw, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
  moderator: { id: string; name: string | null; steamName: string | null }
  community?: { id: string; name: string; slug: string; logoUrl: string | null } | null
  resolvedBy: { id: string; name: string | null; steamName: string | null } | null
}

interface Props {
  mode: "nexus" | "community"
  communitySlug?: string
  communityName?: string
  currentUserId: string
  isNexusTeam: boolean
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

function getUserDisplayName(u: { name: string | null; steamName: string | null }) {
  return u.steamName ?? u.name ?? "Utilisateur"
}

function getUserAvatar(u: { steamAvatar?: string | null; customAvatar?: string | null; image?: string | null }) {
  return u.customAvatar ?? u.steamAvatar ?? u.image ?? undefined
}

export function ModerationPanel({ mode, communitySlug, communityName, currentUserId, isNexusTeam }: Props) {
  const [actions, setActions] = useState<ModerationAction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const [filterType, setFilterType] = useState<string>("all")
  const [filterTarget, setFilterTarget] = useState("")

  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<ActionType>("WARN")
  const [formTargetId, setFormTargetId] = useState("")
  const [formReason, setFormReason] = useState("")
  const [formNote, setFormNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [resolveAction, setResolveAction] = useState<ModerationAction | null>(null)
  const [resolveNote, setResolveNote] = useState("")
  const [resolving, setResolving] = useState(false)

  const apiBase = mode === "nexus" ? "/api/moderation" : `/api/communities/${communitySlug}/moderation`

  const fetchActions = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (filterType !== "all") params.set("type", filterType)
      if (filterTarget.trim()) params.set("targetId", filterTarget.trim())
      const res = await fetch(`${apiBase}?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setActions(data.actions)
      setTotal(data.total)
      setPage(data.page)
      setTotalPages(data.totalPages)
      setLoaded(true)
    } catch {
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }, [apiBase, filterType, filterTarget])

  const availableTypes: ActionType[] = mode === "nexus"
    ? ["WARN", "KICK", "BAN_COMMUNITY", "BAN_PLATFORM", "UNBAN"]
    : ["WARN", "KICK", "BAN_COMMUNITY", "UNBAN"]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formTargetId.trim() || !formReason.trim()) return
    setSubmitting(true)
    try {
      const body: Record<string, string> = {
        type: formType,
        targetId: formTargetId.trim(),
        reason: formReason.trim(),
      }
      if (formNote.trim()) body.note = formNote.trim()
      if (communitySlug && formType !== "BAN_PLATFORM") body.communityId = "" // sera ignoré côté communauté

      const res = await fetch(apiBase, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erreur")
      }
      toast.success("Action de modération créée")
      setShowForm(false)
      setFormTargetId("")
      setFormReason("")
      setFormNote("")
      fetchActions(1)
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de la création")
    } finally {
      setSubmitting(false)
    }
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Modération{communityName ? ` — ${communityName}` : " Plateforme"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "nexus"
              ? "Toutes les actions de modération sur la plateforme"
              : "Actions de modération de cette communauté"}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle action
        </Button>
      </div>

      {/* Filtres + Chargement */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[160px]">
              <Label className="text-xs mb-1 block">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {availableTypes.map((t) => (
                    <SelectItem key={t} value={t}>{ACTION_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs mb-1 block">ID Utilisateur cible</Label>
              <Input
                className="h-9"
                placeholder="ID utilisateur..."
                value={filterTarget}
                onChange={(e) => setFilterTarget(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-9" onClick={() => fetchActions(1)} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste */}
      {!loaded ? (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Cliquez sur "Rechercher" pour charger les actions</p>
        </div>
      ) : loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Chargement...</div>
      ) : actions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Aucune action de modération</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{total} action{total > 1 ? "s" : ""} trouvée{total > 1 ? "s" : ""}</p>
          {actions.map((action) => (
            <Card key={action.id} className={action.resolvedAt ? "opacity-60" : ""}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={getUserAvatar(action.target)} />
                    <AvatarFallback>{getUserDisplayName(action.target)[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{getUserDisplayName(action.target)}</span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${ACTION_COLORS[action.type]}`}>
                        {ACTION_ICONS[action.type]}
                        {ACTION_LABELS[action.type]}
                      </span>
                      {action.resolvedAt && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                          Résolu
                        </span>
                      )}
                      {action.community && mode === "nexus" && (
                        <span className="text-xs text-muted-foreground">
                          via <span className="font-medium">{action.community.name}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{action.reason}</p>
                    {action.note && (
                      <p className="text-xs text-muted-foreground mt-1 italic">Note interne : {action.note}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Par <span className="font-medium">{getUserDisplayName(action.moderator)}</span></span>
                      <span>{format(new Date(action.createdAt), "d MMM yyyy à HH:mm", { locale: fr })}</span>
                      {action.expiresAt && (
                        <span>Expire le {format(new Date(action.expiresAt), "d MMM yyyy", { locale: fr })}</span>
                      )}
                      {action.resolvedAt && action.resolvedBy && (
                        <span>Résolu par {getUserDisplayName(action.resolvedBy)} le {format(new Date(action.resolvedAt), "d MMM yyyy", { locale: fr })}</span>
                      )}
                    </div>
                  </div>
                  {!action.resolvedAt && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => { setResolveAction(action); setResolveNote("") }}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Résoudre
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(action.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  {action.resolvedAt && isNexusTeam && (
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive shrink-0" onClick={() => handleDelete(action.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchActions(page - 1)}>
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchActions(page + 1)}>
                Suivant
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialog nouvelle action */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle action de modération</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Type d'action</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v as ActionType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        {ACTION_ICONS[t]}
                        {ACTION_LABELS[t]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ID de l'utilisateur ciblé</Label>
              <Input
                className="mt-1"
                placeholder="ID utilisateur..."
                value={formTargetId}
                onChange={(e) => setFormTargetId(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Visible sur le profil de l'utilisateur</p>
            </div>
            <div>
              <Label>Raison <span className="text-destructive">*</span></Label>
              <Textarea
                className="mt-1 resize-none"
                rows={3}
                placeholder="Motif de la sanction..."
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                required
                maxLength={500}
              />
            </div>
            <div>
              <Label>Note interne <span className="text-muted-foreground text-xs">(optionnelle)</span></Label>
              <Textarea
                className="mt-1 resize-none"
                rows={2}
                placeholder="Note visible uniquement par le staff..."
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                maxLength={500}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" disabled={submitting || !formTargetId.trim() || !formReason.trim()}>
                {submitting ? "Enregistrement..." : "Confirmer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog résolution */}
      <Dialog open={!!resolveAction} onOpenChange={(o) => !o && setResolveAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Résoudre l'action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {resolveAction && (
              <p className="text-sm text-muted-foreground">
                Marquer comme résolue l'action <span className="font-medium">{ACTION_LABELS[resolveAction.type]}</span> sur{" "}
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
