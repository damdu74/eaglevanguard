"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, Plus, Trash2, Pencil, Check, X, Lock } from "lucide-react"

interface NexusRank {
  id: string
  name: string
  abbreviation: string
  order: number
  color: string
  isProtected: boolean
  category: string
}

interface Props {
  initialRanks: NexusRank[]
}

function RankSection({ title, description, category, ranks, setRanks }: {
  title: string
  description: string
  category: "ROLE" | "FUNCTION"
  ranks: NexusRank[]
  setRanks: React.Dispatch<React.SetStateAction<NexusRank[]>>
}) {
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#6366f1")
  const [creating, setCreating] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const [editOrder, setEditOrder] = useState(0)
  const [saving, setSaving] = useState(false)

  const sectionRanks = ranks.filter(r => r.category === category)

  async function createRank() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/nexus/ranks", {
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
      toast.success(`${title.slice(0, -1)} créé`)
    } catch { toast.error("Erreur lors de la création") }
    finally { setCreating(false) }
  }

  function startEdit(rank: NexusRank) {
    setEditingId(rank.id); setEditName(rank.name)
    setEditColor(rank.color); setEditOrder(rank.order)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/nexus/ranks/${id}`, {
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
    finally { setSaving(false) }
  }

  async function deleteRank(id: string) {
    try {
      const res = await fetch(`/api/nexus/ranks/${id}`, { method: "DELETE" })
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
      <CardContent className="space-y-3">
        {sectionRanks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">Aucun élément.</p>
        )}

        {sectionRanks.map(rank => (
          <div key={rank.id}>
            {rank.isProtected ? (
              <div className="flex items-center justify-between opacity-50">
                <div className="flex items-center gap-2">
                  <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: rank.color }} />
                  <span className="text-sm font-medium">{rank.name}</span>
                </div>
                <span className="text-xs border border-border rounded px-1.5 py-0.5 text-muted-foreground">Protégé</span>
              </div>
            ) : editingId === rank.id ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nom" className="w-40 h-7 text-xs" />
                <Input type="number" value={editOrder} onChange={e => setEditOrder(Number(e.target.value))} placeholder="Ordre" className="w-14 h-7 text-xs" />
                <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="h-7 w-8 cursor-pointer rounded border border-border" />
                <Button size="sm" className="h-7 px-2" onClick={() => saveEdit(rank.id)} disabled={saving}>
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingId(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: rank.color }} />
                  <span className="text-sm font-medium">{rank.name}</span>
                  <span className="text-xs text-muted-foreground">#{rank.order}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEdit(rank)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => deleteRank(rank.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Ajouter</Label>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nom" className="w-40 h-7 text-xs" />
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

export function NexusRanksManager({ initialRanks }: Props) {
  const [ranks, setRanks] = useState<NexusRank[]>(initialRanks)

  return (
    <div className="grid grid-cols-2 gap-4">
      <RankSection
        title="Rôles"
        description="Positions hiérarchiques au sein de la NEXUS Team."
        category="ROLE"
        ranks={ranks}
        setRanks={setRanks}
      />
      <RankSection
        title="Fonctions"
        description="Responsabilités et spécialités techniques."
        category="FUNCTION"
        ranks={ranks}
        setRanks={setRanks}
      />
    </div>
  )
}
