"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, Trash2, Pencil, Check, X, Lock, ChevronDown, ChevronUp } from "lucide-react"
import { Eagle Vanguard_PERMISSIONS, Eagle Vanguard_PERMISSION_LABELS, type Eagle VanguardPermission } from "@/lib/permissions"

interface EagleVanguardRank {
  id: string
  name: string
  abbreviation: string
  order: number
  color: string
  permissions: string[]
  isProtected: boolean
  category: string
}

interface Props {
  initialRanks: EagleVanguardRank[]
}

function RankSection({ title, description, category, ranks, setRanks }: {
  title: string
  description: string
  category: "ROLE" | "FUNCTION"
  ranks: EagleVanguardRank[]
  setRanks: React.Dispatch<React.SetStateAction<EagleVanguardRank[]>>
}) {
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#6366f1")
  const [creating, setCreating] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const [editOrder, setEditOrder] = useState(0)
  const [saving, setSaving] = useState<string | null>(null)

  const [expanded, setExpanded] = useState<string | null>(null)

  const sectionRanks = ranks.filter(r => r.category === category)

  async function createRank() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/eagle-vanguard/ranks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          abbreviation: newName.trim().slice(0, 3).toUpperCase(),
          order: sectionRanks.length,
          color: newColor,
          category,
        }),
      })
      if (!res.ok) throw new Error()
      const rank = await res.json()
      setRanks(prev => [...prev, rank])
      setNewName(""); setNewColor("#6366f1")
      toast.success(`${category === "ROLE" ? "Rôle" : "Fonction"} créé`)
    } catch { toast.error("Erreur lors de la création") }
    finally { setCreating(false) }
  }

  function startEdit(rank: EagleVanguardRank) {
    setEditingId(rank.id); setEditName(rank.name)
    setEditColor(rank.color); setEditOrder(rank.order)
  }

  async function saveEdit(id: string) {
    setSaving(id)
    try {
      const res = await fetch(`/api/eagle-vanguard/ranks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, color: editColor, order: editOrder }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setRanks(prev => prev.map(r => r.id === id ? updated : r).sort((a, b) => a.order - b.order))
      setEditingId(null)
      toast.success("Modifié")
    } catch { toast.error("Erreur lors de la modification") }
    finally { setSaving(null) }
  }

  async function savePermissions(rank: EagleVanguardRank) {
    setSaving(rank.id)
    try {
      const res = await fetch(`/api/eagle-vanguard/ranks/${rank.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: rank.permissions }),
      })
      if (!res.ok) throw new Error()
      toast.success("Permissions sauvegardées")
    } catch { toast.error("Erreur lors de la sauvegarde") }
    finally { setSaving(null) }
  }

  function togglePermission(rankId: string, perm: Eagle VanguardPermission) {
    setRanks(prev => prev.map(r => {
      if (r.id !== rankId) return r
      const has = r.permissions.includes(perm)
      return { ...r, permissions: has ? r.permissions.filter(p => p !== perm) : [...r.permissions, perm] }
    }))
  }

  async function deleteRank(id: string) {
    try {
      const res = await fetch(`/api/eagle-vanguard/ranks/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setRanks(prev => prev.filter(r => r.id !== id))
      toast.success("Supprimé")
    } catch { toast.error("Erreur lors de la suppression") }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sectionRanks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">Aucun élément.</p>
        )}

        {sectionRanks.map(rank => (
          <div key={rank.id} className="rounded-md border">
            {rank.isProtected ? (
              <div className="flex items-center justify-between px-3 py-2 opacity-60">
                <div className="flex items-center gap-2">
                  <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: rank.color }} />
                  <span className="text-sm font-medium">{rank.name}</span>
                  {category === "ROLE" && (
                    <span className="text-xs text-primary ml-1">Tous les droits</span>
                  )}
                </div>
                <span className="text-xs border border-border rounded px-1.5 py-0.5 text-muted-foreground">Protégé</span>
              </div>
            ) : editingId === rank.id ? (
              <div className="flex items-center gap-1.5 flex-wrap px-3 py-2">
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nom" className="w-36 h-7 text-xs" />
                <Input type="number" value={editOrder} onChange={e => setEditOrder(Number(e.target.value))} placeholder="Ordre" className="w-14 h-7 text-xs" />
                <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="h-7 w-8 cursor-pointer rounded border border-border" />
                <Button size="sm" className="h-7 px-2" onClick={() => saveEdit(rank.id)} disabled={saving === rank.id}>
                  {saving === rank.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingId(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: rank.color }} />
                    <span className="text-sm font-medium">{rank.name}</span>
                    <span className="text-xs text-muted-foreground">#{rank.order}</span>
                    {category === "ROLE" && rank.permissions.length > 0 && (
                      <span className="text-xs text-primary">{rank.permissions.length} perm.</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {category === "ROLE" && (
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setExpanded(expanded === rank.id ? null : rank.id)}>
                        {expanded === rank.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEdit(rank)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => deleteRank(rank.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {category === "ROLE" && expanded === rank.id && (
                  <div className="border-t px-3 py-2 space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Permissions</p>
                    {Eagle Vanguard_PERMISSIONS.map((perm) => (
                      <div key={perm} className="flex items-center justify-between">
                        <span className="text-xs">{Eagle Vanguard_PERMISSION_LABELS[perm]}</span>
                        <Switch
                          checked={rank.permissions.includes(perm)}
                          onCheckedChange={() => togglePermission(rank.id, perm)}
                        />
                      </div>
                    ))}
                    <div className="pt-1">
                      <Button size="sm" className="h-7 text-xs" onClick={() => savePermissions(rank)} disabled={saving === rank.id}>
                        {saving === rank.id ? "Sauvegarde..." : "Sauvegarder"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        <Separator />

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Ajouter</Label>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nom" className="flex-1 h-7 text-xs" />
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-7 w-8 cursor-pointer rounded border border-border" />
            <Button size="sm" className="h-7 px-2" onClick={createRank} disabled={creating || !newName.trim()}>
              {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EagleVanguardRanksManager({ initialRanks }: Props) {
  const [ranks, setRanks] = useState<EagleVanguardRank[]>(initialRanks)

  return (
    <div className="grid grid-cols-2 gap-4">
      <RankSection
        title="Rôles"
        description="Positions hiérarchiques avec permissions sur la plateforme."
        category="ROLE"
        ranks={ranks}
        setRanks={setRanks}
      />
      <RankSection
        title="Fonctions"
        description="Responsabilités et spécialités — décoratif uniquement."
        category="FUNCTION"
        ranks={ranks}
        setRanks={setRanks}
      />
    </div>
  )
}
