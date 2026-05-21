"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react"

interface Rank {
  id: string
  name: string
  abbreviation: string
  order: number
}

interface Props {
  communitySlug: string
  initialRanks: Rank[]
}

export function RanksManager({ communitySlug, initialRanks }: Props) {
  const router = useRouter()
  const [ranks, setRanks] = useState(initialRanks)
  const [newName, setNewName] = useState("")
  const [newAbbr, setNewAbbr] = useState("")
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editAbbr, setEditAbbr] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)

  async function addRank() {
    if (!newName.trim() || !newAbbr.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/ranks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), abbreviation: newAbbr.trim() }),
      })
      if (!res.ok) throw new Error()
      const rank = await res.json()
      setRanks((prev) => [...prev, rank])
      setNewName("")
      setNewAbbr("")
      toast.success("Grade ajouté")
    } catch {
      toast.error("Erreur lors de l'ajout")
    } finally {
      setAdding(false)
    }
  }

  async function deleteRank(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/ranks/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setRanks((prev) => prev.filter((r) => r.id !== id))
      toast.success("Grade supprimé")
      router.refresh()
    } catch {
      toast.error("Erreur lors de la suppression")
    } finally {
      setDeletingId(null)
    }
  }

  function startEdit(rank: Rank) {
    setEditingId(rank.id)
    setEditName(rank.name)
    setEditAbbr(rank.abbreviation)
  }

  async function saveEdit(id: string) {
    setSavingId(id)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/ranks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), abbreviation: editAbbr.trim() }),
      })
      if (!res.ok) throw new Error()
      setRanks((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, name: editName.trim(), abbreviation: editAbbr.trim() } : r
        )
      )
      setEditingId(null)
      toast.success("Grade modifié")
    } catch {
      toast.error("Erreur lors de la modification")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajouter un grade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Input
              placeholder="Nom du grade (ex : Caporal)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={50}
            />
            <Input
              placeholder="Abrév. (ex : CPL)"
              value={newAbbr}
              onChange={(e) => setNewAbbr(e.target.value)}
              maxLength={10}
              className="w-28"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={addRank} disabled={adding || !newName.trim() || !newAbbr.trim()}>
              {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {ranks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grades existants</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {ranks.map((rank) => (
                <div key={rank.id} className="flex items-center gap-3 px-4 py-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />

                  {editingId === rank.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-8"
                        maxLength={50}
                      />
                      <Input
                        value={editAbbr}
                        onChange={(e) => setEditAbbr(e.target.value)}
                        className="w-24 h-8"
                        maxLength={10}
                      />
                      <Button
                        size="sm"
                        onClick={() => saveEdit(rank.id)}
                        disabled={savingId === rank.id}
                      >
                        {savingId === rank.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium">{rank.name}</span>
                      <span className="text-xs text-muted-foreground font-mono w-16 text-center">
                        [{rank.abbreviation}]
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(rank)}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteRank(rank.id)}
                        disabled={deletingId === rank.id}
                      >
                        {deletingId === rank.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />
                        }
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {ranks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucun grade défini pour cette communauté.
        </p>
      )}
    </div>
  )
}
