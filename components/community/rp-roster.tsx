"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, Plus, Trash2, Settings, Sword, Users, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function GameSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const base = value.startsWith("arma3") ? "arma3" : "__none__"
  const sub  = value === "arma3-principale" ? "arma3-principale"
             : value === "arma3-secondaire"  ? "arma3-secondaire"
             : "__none__"
  return (
    <div className="space-y-2">
      <Select value={base} onValueChange={(v) => onChange(v === "__none__" ? "" : "arma3")}>
        <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Aucun</SelectItem>
          <SelectItem value="arma3">Arma 3</SelectItem>
        </SelectContent>
      </Select>
      {base === "arma3" && (
        <Select value={sub} onValueChange={(v) => onChange(v === "__none__" ? "arma3" : v)}>
          <SelectTrigger><SelectValue placeholder="Aucune variante" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Aucune variante</SelectItem>
            <SelectItem value="arma3-principale">Trame Principale</SelectItem>
            <SelectItem value="arma3-secondaire">Hors Série</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}


interface RpUnit {
  id: string
  name: string
  description: string | null
  era: string | null
  game: string | null
  columnConfig: unknown
  imageUrl: string | null
  _count: { characters: number }
}

interface Props {
  communitySlug: string
  units: RpUnit[]
  isStaff: boolean
}

export function RpRoster({ communitySlug, units, isStaff }: Props) {
  const router = useRouter()

  const [createDialog, setCreateDialog] = useState(false)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [era, setEra] = useState("")
  const [game, setGame] = useState("")
  const [saving, setSaving] = useState(false)

  const [editUnit, setEditUnit] = useState<RpUnit | null>(null)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editEra, setEditEra] = useState("")
  const [editGame, setEditGame] = useState("")
  const [editSaving, setEditSaving] = useState(false)


  function openEdit(unit: RpUnit, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setEditUnit(unit); setEditName(unit.name)
    setEditDesc(unit.description ?? ""); setEditEra(unit.era ?? ""); setEditGame(unit.game ?? "")
  }

async function createUnit() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: desc.trim() || null, era: era.trim() || null, game: game || null }),
      })
      if (!res.ok) throw new Error()
      toast.success("Unité créée")
      setCreateDialog(false); setName(""); setDesc(""); setEra(""); setGame("")
      router.refresh()
    } catch {
      toast.error("Erreur lors de la création")
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit() {
    if (!editUnit || !editName.trim()) return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/units/${editUnit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null, era: editEra.trim() || null, game: editGame || null }),
      })
      if (!res.ok) throw new Error()
      toast.success("Unité mise à jour")
      setEditUnit(null); router.refresh()
    } catch {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setEditSaving(false)
    }
  }

  async function deleteUnit(id: string, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/units/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Unité supprimée"); router.refresh()
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  return (
    <div className="space-y-4">
      {isStaff && (
        <div>
          <Button size="sm" variant="outline" onClick={() => setCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nouvelle unité
          </Button>
        </div>
      )}

      {units.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground text-center">
          <Sword className="h-10 w-10 opacity-30" />
          <p className="font-medium">Aucune unité pour l&apos;instant.</p>
          {isStaff && <p className="text-sm">Créez une unité pour que les membres puissent y ajouter leur personnage.</p>}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => (
            <div key={unit.id} className="relative group">
              <Link href={`/communities/${communitySlug}/rp/${unit.id}?from=registre`} className="block h-full">
                <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
                  <CardContent className="p-4 flex flex-col h-full gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {unit.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={unit.imageUrl}
                          alt=""
                          className="h-8 w-8 shrink-0 object-contain rounded"
                        />
                      ) : (
                        <Sword className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <span className="font-semibold truncate">{unit.name}</span>
                    </div>
                    {unit.era && <Badge variant="outline" className="text-xs w-fit">{unit.era}</Badge>}
                    {unit.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{unit.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-1 mt-auto">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {unit._count.characters} personnage{unit._count.characters !== 1 ? "s" : ""}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {isStaff && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => openEdit(unit, e)}
                    className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                    title="Paramètres"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => deleteUnit(unit.id, e)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog création */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle unité RP</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nom de l&apos;unité</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: 101st Airborne Division" />
            </div>
            <div className="space-y-1">
              <Label>Genre <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input value={era} onChange={(e) => setEra(e.target.value)} placeholder="Ex: WW2, Guerre Froide, Moderne…" />
            </div>
            <div className="space-y-1">
              <Label>Jeu <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <GameSelect value={game} onChange={setGame} />
            </div>
            <div className="space-y-1">
              <Label>Description <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
                placeholder="Contexte, histoire de l'unité…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Annuler</Button>
            <Button onClick={createUnit} disabled={saving || !name.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog édition */}
      <Dialog open={!!editUnit} onOpenChange={(open) => !open && setEditUnit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier l&apos;unité</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nom de l&apos;unité</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Genre <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input value={editEra} onChange={(e) => setEditEra(e.target.value)} placeholder="Ex: WW2, Guerre Froide, Moderne…" />
            </div>
            <div className="space-y-1">
              <Label>Jeu <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <GameSelect value={editGame} onChange={setEditGame} />
            </div>
            <div className="space-y-1">
              <Label>Description <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUnit(null)}>Annuler</Button>
            <Button onClick={saveEdit} disabled={editSaving || !editName.trim()}>
              {editSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
