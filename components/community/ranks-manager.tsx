"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, Trash2, Pencil, Check, X, Crown, ChevronDown, ChevronUp } from "lucide-react"
import { COMMUNITY_PERMISSIONS, PERMISSION_LABELS, type CommunityPermission } from "@/lib/permissions"

interface Rank {
  id: string
  name: string
  order: number
  color: string
  permissions: string[]
  isPermanent: boolean
}

interface Props {
  communitySlug: string
  initialRanks: Rank[]
}

export function RanksManager({ communitySlug, initialRanks }: Props) {
  const [ranks, setRanks] = useState<Rank[]>(initialRanks)
  const [expanded, setExpanded] = useState<string | null>(null)

  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#6366f1")
  const [adding, setAdding] = useState(false)

  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const [editOrder, setEditOrder] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const sorted = [...ranks].sort((a, b) => {
    if (a.isPermanent && !b.isPermanent) return -1
    if (!a.isPermanent && b.isPermanent) return 1
    return a.order - b.order
  })

  async function addRank() {
    if (!newName.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/ranks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      })
      if (!res.ok) throw new Error()
      const rank = await res.json()
      setRanks(prev => [...prev, rank])
      setNewName(""); setNewColor("#6366f1")
      toast.success("Grade ajouté")
    } catch { toast.error("Erreur lors de l'ajout") }
    finally { setAdding(false) }
  }

  function startEdit(rank: Rank) {
    setEditingId(rank.id); setEditName(rank.name)
    setEditColor(rank.color); setEditOrder(rank.order)
  }

  async function saveEdit(id: string) {
    setSaving(id)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/ranks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), color: editColor, order: editOrder }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setRanks(prev => prev.map(r => r.id === id ? updated : r).sort((a, b) => a.order - b.order))
      setEditingId(null)
      toast.success("Grade modifié")
    } catch { toast.error("Erreur lors de la modification") }
    finally { setSaving(null) }
  }

  async function savePermissions(rank: Rank) {
    setSaving(rank.id)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/ranks/${rank.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: rank.permissions }),
      })
      if (!res.ok) throw new Error()
      toast.success("Permissions sauvegardées")
    } catch { toast.error("Erreur lors de la sauvegarde") }
    finally { setSaving(null) }
  }

  function togglePermission(rankId: string, permission: CommunityPermission) {
    setRanks(prev => prev.map(r => {
      if (r.id !== rankId) return r
      const has = r.permissions.includes(permission)
      return { ...r, permissions: has ? r.permissions.filter(p => p !== permission) : [...r.permissions, permission] }
    }))
  }

  async function deleteRank(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/ranks/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setRanks(prev => prev.filter(r => r.id !== id))
      toast.success("Grade supprimé")
    } catch { toast.error("Erreur lors de la suppression") }
    finally { setDeletingId(null) }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grades communautaires</CardTitle>
        <CardDescription>Définissez la hiérarchie et les permissions de votre communauté.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun grade défini.</p>
        )}

        {sorted.map(rank => (
          <div key={rank.id} className="rounded-lg border">
            {/* En-tête du grade */}
            <div className="flex items-center justify-between px-4 py-3">
              {!rank.isPermanent && editingId === rank.id ? (
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nom" className="flex-1 h-8 text-sm" />
                  <Input type="number" value={editOrder} onChange={e => setEditOrder(Number(e.target.value))} placeholder="Ordre" className="w-20 h-8 text-sm" />
                  <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border" />
                  <Button size="sm" className="h-8" onClick={() => saveEdit(rank.id)} disabled={saving === rank.id}>
                    {saving === rank.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    {rank.isPermanent && <Crown className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: rank.color }} />
                    <span className="text-sm font-medium">{rank.name}</span>
                    {!rank.isPermanent && <span className="text-xs text-muted-foreground">#{rank.order}</span>}
                    {rank.permissions.length > 0 && (
                      <span className="text-xs text-primary">{rank.permissions.length} permission{rank.permissions.length > 1 ? "s" : ""}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {rank.isPermanent ? (
                      <span className="text-xs text-yellow-600 border border-yellow-400/50 rounded px-2 py-0.5">Permanent</span>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(rank)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setExpanded(expanded === rank.id ? null : rank.id)}>
                          {expanded === rank.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => deleteRank(rank.id)}
                          disabled={deletingId === rank.id}
                        >
                          {deletingId === rank.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Permissions (dépliables, non-permanents uniquement) */}
            {!rank.isPermanent && expanded === rank.id && (
              <div className="border-t px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Permissions staff</p>
                {COMMUNITY_PERMISSIONS.map((perm) => (
                  <div key={perm} className="flex items-center justify-between">
                    <span className="text-sm">{PERMISSION_LABELS[perm]}</span>
                    <Switch
                      checked={rank.permissions.includes(perm)}
                      onCheckedChange={() => togglePermission(rank.id, perm)}
                    />
                  </div>
                ))}
                <div className="pt-2">
                  <Button size="sm" onClick={() => savePermissions(rank)} disabled={saving === rank.id}>
                    {saving === rank.id ? "Sauvegarde..." : "Sauvegarder les permissions"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Nouveau grade</Label>
          <div className="flex items-center gap-2 flex-wrap">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nom du grade" className="flex-1 h-8 text-sm" maxLength={50} />
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border" title="Couleur" />
            <Button size="sm" className="h-8" onClick={addRank} disabled={adding || !newName.trim()}>
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5 mr-1" />Créer</>}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
