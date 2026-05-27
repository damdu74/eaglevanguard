"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, Plus, Trash2, Pencil, Check, X, Crown } from "lucide-react"

interface Rank {
  id: string
  name: string
  abbreviation: string
  order: number
  color: string
  isPermanent: boolean
}

interface Props {
  communitySlug: string
  initialRanks: Rank[]
}

export function RanksManager({ communitySlug, initialRanks }: Props) {
  const [ranks, setRanks] = useState<Rank[]>(initialRanks)

  // Création
  const [newName, setNewName] = useState("")
  const [newAbbr, setNewAbbr] = useState("")
  const [newColor, setNewColor] = useState("#6366f1")
  const [adding, setAdding] = useState(false)

  // Édition inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editAbbr, setEditAbbr] = useState("")
  const [editColor, setEditColor] = useState("")
  const [editOrder, setEditOrder] = useState(0)
  const [saving, setSaving] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const sorted = [...ranks].sort((a, b) => {
    if (a.isPermanent && !b.isPermanent) return -1
    if (!a.isPermanent && b.isPermanent) return 1
    return a.order - b.order
  })

  async function addRank() {
    if (!newName.trim() || !newAbbr.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/ranks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), abbreviation: newAbbr.trim(), color: newColor }),
      })
      if (!res.ok) throw new Error()
      const rank = await res.json()
      setRanks(prev => [...prev, rank])
      setNewName(""); setNewAbbr(""); setNewColor("#6366f1")
      toast.success("Grade ajouté")
    } catch { toast.error("Erreur lors de l'ajout") }
    finally { setAdding(false) }
  }

  function startEdit(rank: Rank) {
    setEditingId(rank.id); setEditName(rank.name)
    setEditAbbr(rank.abbreviation); setEditColor(rank.color); setEditOrder(rank.order)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/ranks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), abbreviation: editAbbr.trim(), color: editColor, order: editOrder }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setRanks(prev => prev.map(r => r.id === id ? updated : r).sort((a, b) => a.order - b.order))
      setEditingId(null)
      toast.success("Grade modifié")
    } catch { toast.error("Erreur lors de la modification") }
    finally { setSaving(false) }
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
        <CardDescription>Définissez la hiérarchie de votre communauté.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun grade défini.</p>
        )}

        {sorted.map(rank => (
          <div key={rank.id}>
            {!rank.isPermanent && editingId === rank.id ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nom" className="w-40 h-8 text-sm" />
                <Input value={editAbbr} onChange={e => setEditAbbr(e.target.value)} placeholder="Abrév." className="w-20 h-8 text-sm" maxLength={10} />
                <Input type="number" value={editOrder} onChange={e => setEditOrder(Number(e.target.value))} placeholder="Ordre" className="w-20 h-8 text-sm" />
                <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border" />
                <Button size="sm" className="h-8" onClick={() => saveEdit(rank.id)} disabled={saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {rank.isPermanent
                    ? <Crown className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                    : null
                  }
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded font-bold text-white"
                    style={{ backgroundColor: rank.color }}
                  >
                    {rank.abbreviation}
                  </span>
                  <span className="text-sm font-medium">{rank.name}</span>
                  {!rank.isPermanent && (
                    <span className="text-xs text-muted-foreground">#{rank.order}</span>
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
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteRank(rank.id)}
                        disabled={deletingId === rank.id}
                      >
                        {deletingId === rank.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Nouveau grade</Label>
          <div className="flex items-center gap-2 flex-wrap">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nom du grade" className="w-44 h-8 text-sm" maxLength={50} />
            <Input value={newAbbr} onChange={e => setNewAbbr(e.target.value)} placeholder="Abrév." className="w-20 h-8 text-sm" maxLength={10} />
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border" title="Couleur" />
            <Button size="sm" className="h-8" onClick={addRank} disabled={adding || !newName.trim() || !newAbbr.trim()}>
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5 mr-1" />Créer</>}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
