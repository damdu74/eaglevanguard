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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Loader2, Plus, Trash2, Pencil, UserCircle2,
  ChevronUp, ChevronDown, FolderPlus, Users,
} from "lucide-react"

interface RpGroup {
  id: string
  name: string
  order: number
}

interface RpCharacter {
  id: string
  name: string
  role: string | null
  description: string | null
  rpGroupId: string | null
  user: { id: string; name: string | null; image: string | null; customAvatar: string | null }
}

interface Props {
  communitySlug: string
  unitId: string
  characters: RpCharacter[]
  groups: RpGroup[]
  isStaff: boolean
  currentUserId: string | null
  hasCharacterElsewhere: boolean
}

type DialogType = "create" | "edit" | "role" | "group-create" | "group-rename" | null

export function RpUnitDetail({
  communitySlug, unitId, characters, groups: initialGroups,
  isStaff, currentUserId, hasCharacterElsewhere,
}: Props) {
  const router = useRouter()

  const myCharacter = characters.find((c) => c.user.id === currentUserId) ?? null
  const canCreate = !!currentUserId && !myCharacter && !hasCharacterElsewhere

  const [dialog, setDialog] = useState<DialogType>(null)
  const [charName, setCharName] = useState("")
  const [charDesc, setCharDesc] = useState("")
  const [editRoleCharId, setEditRoleCharId] = useState("")
  const [roleValue, setRoleValue] = useState("")
  const [newGroupName, setNewGroupName] = useState("")
  const [editGroupId, setEditGroupId] = useState("")
  const [editGroupName, setEditGroupName] = useState("")
  const [saving, setSaving] = useState(false)

  const sortedGroups = [...initialGroups].sort((a, b) => a.order - b.order)

  // ── Character actions ───────────────────────────────────────────────────────

  function openCreate() { setCharName(""); setCharDesc(""); setDialog("create") }
  function openEdit() {
    if (!myCharacter) return
    setCharName(myCharacter.name); setCharDesc(myCharacter.description ?? "")
    setDialog("edit")
  }
  function openRole(char: RpCharacter) {
    setEditRoleCharId(char.id); setRoleValue(char.role ?? "")
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
      setDialog(null); router.refresh()
    } catch { toast.error("Erreur lors de la création") }
    finally { setSaving(false) }
  }

  async function saveEdit() {
    if (!myCharacter || !charName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/characters/${myCharacter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: charName.trim(), description: charDesc.trim() || null }),
      })
      if (!res.ok) throw new Error()
      toast.success("Personnage mis à jour")
      setDialog(null); router.refresh()
    } catch { toast.error("Erreur") }
    finally { setSaving(false) }
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
      setDialog(null); router.refresh()
    } catch { toast.error("Erreur") }
    finally { setSaving(false) }
  }

  async function deleteCharacter(id: string) {
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/characters/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Personnage supprimé"); router.refresh()
    } catch { toast.error("Erreur lors de la suppression") }
  }

  async function assignGroup(charId: string, groupId: string | null) {
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/characters/${charId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rpGroupId: groupId }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch { toast.error("Erreur lors de l'assignation") }
  }

  // ── Group actions ───────────────────────────────────────────────────────────

  function openGroupCreate() { setNewGroupName(""); setDialog("group-create") }
  function openGroupRename(g: RpGroup) { setEditGroupId(g.id); setEditGroupName(g.name); setDialog("group-rename") }

  async function createGroup() {
    if (!newGroupName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/units/${unitId}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success("Groupe créé")
      setDialog(null); router.refresh()
    } catch { toast.error("Erreur lors de la création") }
    finally { setSaving(false) }
  }

  async function renameGroup() {
    if (!editGroupName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/units/${unitId}/groups/${editGroupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editGroupName.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success("Groupe renommé")
      setDialog(null); router.refresh()
    } catch { toast.error("Erreur") }
    finally { setSaving(false) }
  }

  async function deleteGroup(id: string) {
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/units/${unitId}/groups/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Groupe supprimé"); router.refresh()
    } catch { toast.error("Erreur lors de la suppression") }
  }

  async function moveGroup(group: RpGroup, direction: "up" | "down") {
    const idx = sortedGroups.findIndex((g) => g.id === group.id)
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sortedGroups.length) return
    const other = sortedGroups[swapIdx]
    await Promise.all([
      fetch(`/api/communities/${communitySlug}/rp/units/${unitId}/groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: other.order }),
      }),
      fetch(`/api/communities/${communitySlug}/rp/units/${unitId}/groups/${other.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: group.order }),
      }),
    ])
    router.refresh()
  }

  const unassigned = characters.filter((c) => !c.rpGroupId)

  return (
    <div className="space-y-6">
      {/* Top actions */}
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
        {isStaff && (
          <Button size="sm" variant="outline" onClick={openGroupCreate}>
            <FolderPlus className="h-4 w-4 mr-1" />
            Nouveau groupe
          </Button>
        )}
        {hasCharacterElsewhere && !myCharacter && (
          <p className="text-xs text-muted-foreground">Vous avez déjà un personnage dans une autre unité.</p>
        )}
      </div>

      {/* No groups — flat table */}
      {sortedGroups.length === 0 && (
        <CharacterTable
          characters={characters}
          groups={[]}
          isStaff={isStaff}
          currentUserId={currentUserId}
          onRole={openRole}
          onDelete={deleteCharacter}
          onAssign={assignGroup}
        />
      )}

      {/* Group sections */}
      {sortedGroups.map((group, idx) => {
        const groupChars = characters.filter((c) => c.rpGroupId === group.id)
        return (
          <div key={group.id} className="space-y-2">
            <div className="flex items-center gap-2 border-b pb-1.5">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-sm">{group.name}</span>
              <Badge variant="secondary" className="text-xs h-5">{groupChars.length}</Badge>
              {isStaff && (
                <div className="flex items-center gap-0.5 ml-auto">
                  <Button size="icon" variant="ghost" className="h-6 w-6"
                    disabled={idx === 0} onClick={() => moveGroup(group, "up")}>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6"
                    disabled={idx === sortedGroups.length - 1} onClick={() => moveGroup(group, "down")}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" title="Renommer"
                    onClick={() => openGroupRename(group)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteGroup(group.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <CharacterTable
              characters={groupChars}
              groups={sortedGroups}
              isStaff={isStaff}
              currentUserId={currentUserId}
              onRole={openRole}
              onDelete={deleteCharacter}
              onAssign={assignGroup}
              emptyMessage="Aucun personnage dans ce groupe."
            />
          </div>
        )
      })}

      {/* Unassigned — only when groups exist */}
      {sortedGroups.length > 0 && unassigned.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 border-b pb-1.5">
            <span className="font-semibold text-sm text-muted-foreground">Engagés</span>
            <Badge variant="outline" className="text-xs h-5">{unassigned.length}</Badge>
          </div>
          <CharacterTable
            characters={unassigned}
            groups={sortedGroups}
            isStaff={isStaff}
            currentUserId={currentUserId}
            onRole={openRole}
            onDelete={deleteCharacter}
            onAssign={assignGroup}
          />
        </div>
      )}

      {/* Dialog — créer personnage */}
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

      {/* Dialog — modifier personnage */}
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

      {/* Dialog — rôle (staff) */}
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

      {/* Dialog — créer groupe */}
      <Dialog open={dialog === "group-create"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau groupe</DialogTitle></DialogHeader>
          <div className="space-y-1">
            <Label>Nom du groupe</Label>
            <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Ex: Peloton 1, Section Alpha…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Annuler</Button>
            <Button onClick={createGroup} disabled={saving || !newGroupName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — renommer groupe */}
      <Dialog open={dialog === "group-rename"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renommer le groupe</DialogTitle></DialogHeader>
          <div className="space-y-1">
            <Label>Nom du groupe</Label>
            <Input value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Annuler</Button>
            <Button onClick={renameGroup} disabled={saving || !editGroupName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CharacterTable({
  characters, groups, isStaff, currentUserId, onRole, onDelete, onAssign, emptyMessage,
}: {
  characters: RpCharacter[]
  groups: RpGroup[]
  isStaff: boolean
  currentUserId: string | null
  onRole: (c: RpCharacter) => void
  onDelete: (id: string) => void
  onAssign: (charId: string, groupId: string | null) => void
  emptyMessage?: string
}) {
  if (characters.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-3 px-1 italic">
        {emptyMessage ?? "Aucun personnage."}
      </p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Personnage</TableHead>
            <TableHead>Joueur</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead className="hidden md:table-cell">Backstory</TableHead>
            {isStaff && groups.length > 0 && <TableHead className="text-center">Groupe</TableHead>}
            <TableHead className="w-20" />
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
                    : <span className="text-xs text-muted-foreground italic">—</span>}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px]">
                  <span className="line-clamp-1">{char.description ?? "—"}</span>
                </TableCell>
                {isStaff && groups.length > 0 && (
                  <TableCell className="text-center">
                    <Select
                      value={char.rpGroupId ?? "none"}
                      onValueChange={(val) => onAssign(char.id, val === "none" ? null : val)}
                    >
                      <SelectTrigger className="h-7 w-[180px] text-xs mx-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">— Sans groupe —</span>
                        </SelectItem>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    {isStaff && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Modifier le rôle"
                        onClick={() => onRole(char)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {(isOwn || isStaff) && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(char.id)}>
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
