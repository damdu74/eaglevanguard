"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Loader2, Plus, Trash2, Pencil, UserCircle2 } from "lucide-react"

interface RpCharacter {
  id: string
  name: string
  role: string | null
  description: string | null
  user: { id: string; name: string | null; image: string | null; customAvatar: string | null }
}

interface Props {
  communitySlug: string
  unitId: string
  characters: RpCharacter[]
  isStaff: boolean
  currentUserId: string | null
  hasCharacterElsewhere: boolean
}

export function RpUnitDetail({ communitySlug, unitId, characters, isStaff, currentUserId, hasCharacterElsewhere }: Props) {
  const router = useRouter()

  const myCharacter = characters.find((c) => c.user.id === currentUserId) ?? null
  const canCreate = !!currentUserId && !myCharacter && !hasCharacterElsewhere

  // Create / edit dialog
  const [dialog, setDialog] = useState<"create" | "edit" | "role" | null>(null)
  const [charName, setCharName] = useState("")
  const [charDesc, setCharDesc] = useState("")
  const [editRoleCharId, setEditRoleCharId] = useState("")
  const [roleValue, setRoleValue] = useState("")
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setCharName(""); setCharDesc("")
    setDialog("create")
  }

  function openEdit() {
    if (!myCharacter) return
    setCharName(myCharacter.name)
    setCharDesc(myCharacter.description ?? "")
    setDialog("edit")
  }

  function openRole(char: RpCharacter) {
    setEditRoleCharId(char.id)
    setRoleValue(char.role ?? "")
    setDialog("role")
  }

  async function createCharacter() {
    if (!charName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: charName.trim(), description: charDesc.trim() || null, rpUnitId: unitId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erreur"); return }
      toast.success("Personnage créé")
      setDialog(null)
      router.refresh()
    } catch {
      toast.error("Erreur lors de la création")
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit() {
    if (!myCharacter || !charName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/characters/${myCharacter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: charName.trim(), description: charDesc.trim() || null, rpUnitId: unitId }),
      })
      if (!res.ok) throw new Error()
      toast.success("Personnage mis à jour")
      setDialog(null)
      router.refresh()
    } catch {
      toast.error("Erreur")
    } finally {
      setSaving(false)
    }
  }

  async function saveRole() {
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/characters/${editRoleCharId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleValue.trim() || null }),
      })
      if (!res.ok) throw new Error()
      toast.success("Rôle mis à jour")
      setDialog(null)
      router.refresh()
    } catch {
      toast.error("Erreur")
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

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Créer mon personnage
          </Button>
        )}
        {myCharacter && (
          <Button size="sm" variant="outline" onClick={openEdit}>
            <Pencil className="h-4 w-4 mr-1" />
            Modifier mon personnage
          </Button>
        )}
        {hasCharacterElsewhere && !myCharacter && (
          <p className="text-xs text-muted-foreground">Vous avez déjà un personnage dans une autre unité.</p>
        )}
      </div>

      {/* Tableau */}
      {characters.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Aucun personnage dans cette unité.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Personnage</TableHead>
                <TableHead>Joueur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="hidden md:table-cell">Backstory</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {characters.map((char) => {
                const avatar = char.user.customAvatar ?? char.user.image
                const isOwn = char.user.id === currentUserId
                return (
                  <TableRow key={char.id}>
                    <TableCell className="font-medium">{char.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <UserCircle2 className="w-6 h-6 text-muted-foreground" />
                        )}
                        <span className="text-sm">{char.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {char.role
                        ? <Badge variant="secondary" className="text-xs">{char.role}</Badge>
                        : <span className="text-xs text-muted-foreground italic">—</span>
                      }
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px]">
                      <span className="line-clamp-1">{char.description ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        {isStaff && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Modifier le rôle"
                            onClick={() => openRole(char)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {(isOwn || isStaff) && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteCharacter(char.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog créer */}
      <Dialog open={dialog === "create"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Créer mon personnage</DialogTitle></DialogHeader>
          <CharacterForm charName={charName} setCharName={setCharName} charDesc={charDesc} setCharDesc={setCharDesc} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Annuler</Button>
            <Button onClick={createCharacter} disabled={saving || !charName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog modifier */}
      <Dialog open={dialog === "edit"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier mon personnage</DialogTitle></DialogHeader>
          <CharacterForm charName={charName} setCharName={setCharName} charDesc={charDesc} setCharDesc={setCharDesc} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Annuler</Button>
            <Button onClick={saveEdit} disabled={saving || !charName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog rôle (staff) */}
      <Dialog open={dialog === "role"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assigner un rôle</DialogTitle></DialogHeader>
          <div className="space-y-1">
            <Label>Rôle / Spécialité</Label>
            <Input value={roleValue} onChange={(e) => setRoleValue(e.target.value)}
              placeholder="Ex: Parachutiste, Sniper, Médecin…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Annuler</Button>
            <Button onClick={saveRole} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CharacterForm({ charName, setCharName, charDesc, setCharDesc }: {
  charName: string; setCharName: (v: string) => void
  charDesc: string; setCharDesc: (v: string) => void
}) {
  return (
    <div className="space-y-3">
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
  )
}
