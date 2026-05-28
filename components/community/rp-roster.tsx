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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Trash2, Sword, Users, ChevronRight, UserCircle2 } from "lucide-react"
import Link from "next/link"

interface RpUnit {
  id: string
  name: string
  description: string | null
  era: string | null
  _count: { characters: number }
}

interface Props {
  communitySlug: string
  units: RpUnit[]
  isStaff: boolean
  canCreate: boolean
  existingCharUnit: { id: string; name: string } | null
}

export function RpRoster({ communitySlug, units, isStaff, canCreate, existingCharUnit }: Props) {
  const router = useRouter()

  // Unit creation
  const [unitDialog, setUnitDialog] = useState(false)
  const [unitName, setUnitName] = useState("")
  const [unitDesc, setUnitDesc] = useState("")
  const [unitEra, setUnitEra] = useState("")

  // Character creation
  const [charDialog, setCharDialog] = useState(false)
  const [charName, setCharName] = useState("")
  const [charDesc, setCharDesc] = useState("")
  const [charUnit, setCharUnit] = useState("")

  const [saving, setSaving] = useState(false)

  async function createUnit() {
    if (!unitName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: unitName.trim(), description: unitDesc.trim() || null, era: unitEra.trim() || null }),
      })
      if (!res.ok) throw new Error()
      toast.success("Unité créée")
      setUnitDialog(false)
      setUnitName(""); setUnitDesc(""); setUnitEra("")
      router.refresh()
    } catch {
      toast.error("Erreur lors de la création")
    } finally {
      setSaving(false)
    }
  }

  async function deleteUnit(id: string) {
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/units/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Unité supprimée")
      router.refresh()
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  async function createCharacter() {
    if (!charName.trim() || !charUnit) return
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: charName.trim(), description: charDesc.trim() || null, rpUnitId: charUnit }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erreur"); return }
      toast.success("Personnage créé")
      setCharDialog(false)
      setCharName(""); setCharDesc(""); setCharUnit("")
      router.push(`/communities/${communitySlug}/rp/${charUnit}`)
    } catch {
      toast.error("Erreur lors de la création")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {canCreate && units.length > 0 && (
          <Button size="sm" onClick={() => { setCharUnit(units[0].id); setCharDialog(true) }}>
            <UserCircle2 className="h-4 w-4 mr-1" />
            Créer mon personnage
          </Button>
        )}
        {!canCreate && existingCharUnit && (
          <p className="text-sm text-muted-foreground">
            Votre personnage est dans{" "}
            <Link
              href={`/communities/${communitySlug}/rp/${existingCharUnit.id}`}
              className="underline underline-offset-2 hover:text-foreground font-medium"
            >
              {existingCharUnit.name}
            </Link>
          </p>
        )}
        {isStaff && (
          <Button size="sm" variant="outline" onClick={() => setUnitDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nouvelle unité
          </Button>
        )}
      </div>

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
              <Link href={`/communities/${communitySlug}/rp/${unit.id}`}>
                <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Sword className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-semibold truncate">{unit.name}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                    {unit.era && <Badge variant="outline" className="text-xs">{unit.era}</Badge>}
                    {unit.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{unit.description}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                      <Users className="h-3.5 w-3.5" />
                      {unit._count.characters} personnage{unit._count.characters !== 1 ? "s" : ""}
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {isStaff && (
                <button
                  onClick={() => deleteUnit(unit.id)}
                  className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:text-destructive text-muted-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog — créer un personnage */}
      <Dialog open={charDialog} onOpenChange={(o) => !o && setCharDialog(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Créer mon personnage</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Unité</Label>
              <Select value={charUnit} onValueChange={setCharUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une unité…" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nom du personnage</Label>
              <Input value={charName} onChange={(e) => setCharName(e.target.value)} placeholder="Ex: John Coffee" />
            </div>
            <div className="space-y-1">
              <Label>Backstory <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Textarea value={charDesc} onChange={(e) => setCharDesc(e.target.value)} rows={3}
                placeholder="Origine, histoire, motivation du personnage…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCharDialog(false)}>Annuler</Button>
            <Button onClick={createCharacter} disabled={saving || !charName.trim() || !charUnit}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — créer une unité */}
      <Dialog open={unitDialog} onOpenChange={setUnitDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle unité RP</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nom de l&apos;unité</Label>
              <Input value={unitName} onChange={(e) => setUnitName(e.target.value)} placeholder="Ex: 101st Airborne Division" />
            </div>
            <div className="space-y-1">
              <Label>Période / Ère <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input value={unitEra} onChange={(e) => setUnitEra(e.target.value)} placeholder="Ex: WW2, Guerre Froide, Moderne…" />
            </div>
            <div className="space-y-1">
              <Label>Description <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Textarea value={unitDesc} onChange={(e) => setUnitDesc(e.target.value)} rows={2}
                placeholder="Contexte, histoire de l'unité…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnitDialog(false)}>Annuler</Button>
            <Button onClick={createUnit} disabled={saving || !unitName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
