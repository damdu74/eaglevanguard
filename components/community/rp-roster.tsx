"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Trash2, UserCircle2, Sword } from "lucide-react"

interface RpUnit {
  id: string
  name: string
  description: string | null
  era: string | null
}

interface RpCharacter {
  id: string
  name: string
  role: string | null
  description: string | null
  rpUnitId: string | null
  user: { id: string; name: string | null; image: string | null; customAvatar: string | null }
}

interface Props {
  communitySlug: string
  units: RpUnit[]
  characters: RpCharacter[]
  isStaff: boolean
  currentUserId: string | null
}

export function RpRoster({ communitySlug, units, characters, isStaff, currentUserId }: Props) {
  const router = useRouter()

  const [unitDialog, setUnitDialog] = useState(false)
  const [charDialog, setCharDialog] = useState(false)
  const [editCharDialog, setEditCharDialog] = useState(false)

  const [unitName, setUnitName] = useState("")
  const [unitDesc, setUnitDesc] = useState("")
  const [unitEra, setUnitEra] = useState("")

  const [charName, setCharName] = useState("")
  const [charRole, setCharRole] = useState("")
  const [charDesc, setCharDesc] = useState("")
  const [charUnit, setCharUnit] = useState("__none__")

  const [saving, setSaving] = useState(false)

  const myCharacter = characters.find((c) => c.user.id === currentUserId) ?? null

  // Grouped by unit
  const byUnit = units.map((u) => ({
    unit: u,
    chars: characters.filter((c) => c.rpUnitId === u.id),
  }))
  const unassigned = characters.filter((c) => c.rpUnitId === null)

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
    if (!charName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: charName.trim(),
          role: charRole.trim() || null,
          description: charDesc.trim() || null,
          rpUnitId: charUnit === "__none__" ? null : charUnit,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erreur"); return }
      toast.success("Personnage créé")
      setCharDialog(false)
      setCharName(""); setCharRole(""); setCharDesc(""); setCharUnit("__none__")
      router.refresh()
    } catch {
      toast.error("Erreur lors de la création")
    } finally {
      setSaving(false)
    }
  }

  async function deleteCharacter(id: string) {
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/characters/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Personnage supprimé")
      router.refresh()
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  function openEditChar() {
    if (!myCharacter) return
    setCharName(myCharacter.name)
    setCharRole(myCharacter.role ?? "")
    setCharDesc(myCharacter.description ?? "")
    setCharUnit(myCharacter.rpUnitId ?? "__none__")
    setEditCharDialog(true)
  }

  async function saveEditCharacter() {
    if (!myCharacter || !charName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/characters/${myCharacter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: charName.trim(),
          role: charRole.trim() || null,
          description: charDesc.trim() || null,
          rpUnitId: charUnit === "__none__" ? null : charUnit,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Personnage mis à jour")
      setEditCharDialog(false)
      router.refresh()
    } catch {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {isStaff && (
          <Button size="sm" variant="outline" onClick={() => setUnitDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nouvelle unité
          </Button>
        )}
        {currentUserId && !myCharacter && (
          <Button size="sm" onClick={() => setCharDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Créer mon personnage
          </Button>
        )}
        {currentUserId && myCharacter && (
          <Button size="sm" variant="outline" onClick={openEditChar}>
            Modifier mon personnage
          </Button>
        )}
      </div>

      {/* Unités */}
      {byUnit.map(({ unit, chars }) => (
        <div key={unit.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sword className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">{unit.name}</h2>
              {unit.era && <Badge variant="outline" className="text-xs">{unit.era}</Badge>}
              <span className="text-xs text-muted-foreground">{chars.length} personnage{chars.length !== 1 ? "s" : ""}</span>
            </div>
            {isStaff && (
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => deleteUnit(unit.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {unit.description && (
            <p className="text-sm text-muted-foreground pl-6">{unit.description}</p>
          )}
          {chars.length === 0 ? (
            <p className="text-sm text-muted-foreground pl-6 italic">Aucun personnage dans cette unité.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 pl-6">
              {chars.map((char) => (
                <CharacterCard
                  key={char.id}
                  char={char}
                  isOwn={char.user.id === currentUserId}
                  isStaff={isStaff}
                  onDelete={() => deleteCharacter(char.id)}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Sans unité */}
      {unassigned.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <UserCircle2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-muted-foreground">Sans unité</h2>
            <span className="text-xs text-muted-foreground">{unassigned.length} personnage{unassigned.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 pl-6">
            {unassigned.map((char) => (
              <CharacterCard
                key={char.id}
                char={char}
                isOwn={char.user.id === currentUserId}
                isStaff={isStaff}
                onDelete={() => deleteCharacter(char.id)}
              />
            ))}
          </div>
        </div>
      )}

      {units.length === 0 && characters.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground text-center">
          <Sword className="h-10 w-10 opacity-30" />
          <p className="font-medium">Aucun personnage pour l&apos;instant.</p>
          {isStaff && <p className="text-sm">Créez une unité, puis les membres pourront y ajouter leurs personnages.</p>}
          {!isStaff && <p className="text-sm">Les membres peuvent créer leur personnage une fois une unité disponible.</p>}
        </div>
      )}

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
              <Textarea value={unitDesc} onChange={(e) => setUnitDesc(e.target.value)} rows={2} placeholder="Contexte, histoire de l'unité…" />
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

      {/* Dialog — créer un personnage */}
      <Dialog open={charDialog} onOpenChange={setCharDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Créer mon personnage</DialogTitle></DialogHeader>
          <CharacterForm
            charName={charName} setCharName={setCharName}
            charRole={charRole} setCharRole={setCharRole}
            charDesc={charDesc} setCharDesc={setCharDesc}
            charUnit={charUnit} setCharUnit={setCharUnit}
            units={units}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCharDialog(false)}>Annuler</Button>
            <Button onClick={createCharacter} disabled={saving || !charName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — modifier son personnage */}
      <Dialog open={editCharDialog} onOpenChange={setEditCharDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier mon personnage</DialogTitle></DialogHeader>
          <CharacterForm
            charName={charName} setCharName={setCharName}
            charRole={charRole} setCharRole={setCharRole}
            charDesc={charDesc} setCharDesc={setCharDesc}
            charUnit={charUnit} setCharUnit={setCharUnit}
            units={units}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCharDialog(false)}>Annuler</Button>
            <Button onClick={saveEditCharacter} disabled={saving || !charName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CharacterForm({
  charName, setCharName,
  charRole, setCharRole,
  charDesc, setCharDesc,
  charUnit, setCharUnit,
  units,
}: {
  charName: string; setCharName: (v: string) => void
  charRole: string; setCharRole: (v: string) => void
  charDesc: string; setCharDesc: (v: string) => void
  charUnit: string; setCharUnit: (v: string) => void
  units: RpUnit[]
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Nom du personnage</Label>
        <Input value={charName} onChange={(e) => setCharName(e.target.value)} placeholder="Ex: John Coffee" />
      </div>
      <div className="space-y-1">
        <Label>Rôle / Spécialité <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
        <Input value={charRole} onChange={(e) => setCharRole(e.target.value)} placeholder="Ex: Parachutiste, Sniper, Médecin…" />
      </div>
      <div className="space-y-1">
        <Label>Unité <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
        <Select value={charUnit} onValueChange={setCharUnit}>
          <SelectTrigger><SelectValue placeholder="Sans unité" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Sans unité</SelectItem>
            {units.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Backstory <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
        <Textarea value={charDesc} onChange={(e) => setCharDesc(e.target.value)} rows={3}
          placeholder="Origine, histoire, motivation du personnage…" />
      </div>
    </div>
  )
}

function CharacterCard({ char, isOwn, isStaff, onDelete }: {
  char: RpCharacter
  isOwn: boolean
  isStaff: boolean
  onDelete: () => void
}) {
  const avatar = char.user.customAvatar ?? char.user.image
  return (
    <Card className="relative">
      <CardHeader className="pb-1 pt-3 px-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <CardTitle className="text-sm leading-tight truncate">{char.name}</CardTitle>
              <p className="text-[11px] text-muted-foreground truncate">{char.user.name}</p>
            </div>
          </div>
          {(isOwn || isStaff) && (
            <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-1">
        {char.role && <Badge variant="secondary" className="text-xs">{char.role}</Badge>}
        {char.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{char.description}</p>
        )}
      </CardContent>
    </Card>
  )
}
