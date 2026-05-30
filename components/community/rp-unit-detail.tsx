"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  ChevronUp, ChevronDown, FolderPlus, Users, Settings,
} from "lucide-react"

type ColumnDef = { key: string; label: string; builtin: boolean; options?: string[] }

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: "grade", label: "Grade", builtin: true, options: [] },
  { key: "role", label: "Fonction", builtin: true },
]

function parseColumns(raw: unknown): ColumnDef[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_COLUMNS
  return (raw as ColumnDef[]).map((c) => ({
    key: String(c.key ?? ""),
    label: String(c.label ?? ""),
    builtin: !!c.builtin,
    options: Array.isArray(c.options) ? c.options.map(String) : undefined,
  }))
}

interface RpGroup {
  id: string
  name: string
  order: number
}

interface RpCharacter {
  id: string
  name: string
  grade: string | null
  role: string | null
  customFields: unknown
  description: string | null
  rpGroupId: string | null
  user: { id: string; name: string | null; image: string | null; customAvatar: string | null }
}

interface Props {
  communitySlug: string
  unitId: string
  characters: RpCharacter[]
  groups: RpGroup[]
  columnConfig: unknown
  isStaff: boolean
  currentUserId: string | null
  canCreate: boolean
}

type DialogType = "create" | "edit" | "role" | "group-create" | "group-rename" | null

export function RpUnitDetail({
  communitySlug, unitId, characters, groups: initialGroups,
  columnConfig: rawColumnConfig, isStaff, currentUserId, canCreate: canCreateProp,
}: Props) {
  const router = useRouter()
  const columns = parseColumns(rawColumnConfig)

  const myCharacter = characters.find((c) => c.user.id === currentUserId) ?? null
  const canCreate = canCreateProp && !myCharacter

  const [dialog, setDialog] = useState<DialogType>(null)
  const [charFirstName, setCharFirstName] = useState("")
  const [charLastName, setCharLastName] = useState("")
  const [editRoleCharId, setEditRoleCharId] = useState("")
  const [gradeValue, setGradeValue] = useState("")
  const [roleValue, setRoleValue] = useState("")
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsColumns, setSettingsColumns] = useState<ColumnDef[]>(columns)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [editGroupId, setEditGroupId] = useState("")
  const [editGroupName, setEditGroupName] = useState("")
  const [saving, setSaving] = useState(false)

  const sortedGroups = [...initialGroups].sort((a, b) => a.order - b.order)

  function openCreate() { setCharFirstName(""); setCharLastName(""); setDialog("create") }
  function openEdit() {
    if (!myCharacter) return
    const parts = myCharacter.name.split(" ")
    setCharFirstName(parts[0] ?? "")
    setCharLastName(parts.slice(1).join(" "))
    setDialog("edit")
  }
  function openRole(char: RpCharacter) {
    setEditRoleCharId(char.id)
    setGradeValue(char.grade ?? "")
    setRoleValue(char.role ?? "")
    const cf = (char.customFields && typeof char.customFields === "object" ? char.customFields : {}) as Record<string, string>
    const init: Record<string, string> = {}
    columns.filter((c) => !c.builtin).forEach((c) => { init[c.key] = cf[c.key] ?? "" })
    setCustomFieldValues(init)
    setDialog("role")
  }

  async function createCharacter() {
    if (!charFirstName.trim() || !charLastName.trim()) return
    const fullName = `${charFirstName.trim()} ${charLastName.trim().toUpperCase()}`
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, rpUnitId: unitId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erreur"); return }
      toast.success("Personnage créé")
      setDialog(null); router.refresh()
    } catch { toast.error("Erreur lors de la création") }
    finally { setSaving(false) }
  }

  async function saveEdit() {
    if (!myCharacter || !charFirstName.trim() || !charLastName.trim()) return
    const fullName = `${charFirstName.trim()} ${charLastName.trim().toUpperCase()}`
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/characters/${myCharacter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName }),
      })
      if (!res.ok) throw new Error()
      toast.success("Personnage mis à jour")
      setDialog(null); router.refresh()
    } catch { toast.error("Erreur") }
    finally { setSaving(false) }
  }

  async function saveRole() {
    setSaving(true)
    const customFields: Record<string, string | null> = {}
    columns.filter((c) => !c.builtin).forEach((c) => {
      customFields[c.key] = customFieldValues[c.key]?.trim() || null
    })
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/characters/${editRoleCharId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: gradeValue.trim() || null,
          role: roleValue.trim() || null,
          ...(Object.keys(customFields).length > 0 && { customFields }),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Informations mises à jour")
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
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: other.order }),
      }),
      fetch(`/api/communities/${communitySlug}/rp/units/${unitId}/groups/${other.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: group.order }),
      }),
    ])
    router.refresh()
  }

  async function saveSettings() {
    if (settingsColumns.some((c) => !c.label.trim())) {
      toast.error("Tous les noms de colonnes sont obligatoires")
      return
    }
    setSettingsSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/units/${unitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnConfig: settingsColumns }),
      })
      if (!res.ok) throw new Error()
      toast.success("Paramètres sauvegardés")
      setSettingsOpen(false)
      router.refresh()
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSettingsSaving(false)
    }
  }

  const unassigned = characters.filter((c) => !c.rpGroupId)
  const dialogTitle = columns.map((c) => c.label).join(" & ")

  return (
    <div className="space-y-6">
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
        {isStaff && (
          <Button size="sm" variant="outline" onClick={() => { setSettingsColumns(columns); setSettingsOpen(true) }}>
            <Settings className="h-4 w-4 mr-1" />
            Paramètres du tableau
          </Button>
        )}
      </div>

      {sortedGroups.length === 0 && (
        <CharacterTable
          characters={characters} groups={[]} columns={columns}
          isStaff={isStaff} currentUserId={currentUserId}
          onRole={openRole} onDelete={deleteCharacter} onAssign={assignGroup}
        />
      )}

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
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openGroupRename(group)}>
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
              characters={groupChars} groups={sortedGroups} columns={columns}
              isStaff={isStaff} currentUserId={currentUserId}
              onRole={openRole} onDelete={deleteCharacter} onAssign={assignGroup}
              emptyMessage="Aucun personnage dans ce groupe."
            />
          </div>
        )
      })}

      {sortedGroups.length > 0 && unassigned.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 border-b pb-1.5">
            <span className="font-semibold text-sm text-muted-foreground">Engagés</span>
            <Badge variant="outline" className="text-xs h-5">{unassigned.length}</Badge>
          </div>
          <CharacterTable
            characters={unassigned} groups={sortedGroups} columns={columns}
            isStaff={isStaff} currentUserId={currentUserId}
            onRole={openRole} onDelete={deleteCharacter} onAssign={assignGroup}
          />
        </div>
      )}

      {/* Dialog — paramètres colonnes */}
      <Dialog open={settingsOpen} onOpenChange={(o) => !o && setSettingsOpen(false)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Paramètres du tableau</DialogTitle></DialogHeader>
          <div className="space-y-5">
            {settingsColumns.map((col) => (
              <div key={col.key} className="space-y-2 border rounded-md p-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-0.5">
                    <Label className="text-xs text-muted-foreground">
                      {col.builtin ? "Colonne intégrée" : "Colonne personnalisée"}
                    </Label>
                    <Input
                      value={col.label}
                      onChange={(e) => setSettingsColumns((prev) => prev.map((c) => c.key === col.key ? { ...c, label: e.target.value } : c))}
                      placeholder="Nom de la colonne"
                      className="h-8"
                    />
                  </div>
                  {!col.builtin && (
                    <Button size="icon" variant="ghost"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive mt-4"
                      onClick={() => setSettingsColumns((prev) => prev.filter((c) => c.key !== col.key))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                {col.key === "grade" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Grades disponibles</Label>
                    {(col.options ?? []).map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={opt}
                          onChange={(e) => setSettingsColumns((prev) => prev.map((c) => c.key === "grade"
                            ? { ...c, options: c.options?.map((o, i) => i === idx ? e.target.value : o) }
                            : c))}
                          className="h-7 text-sm"
                          placeholder="Ex: Sergent, Lieutenant…"
                        />
                        <Button size="icon" variant="ghost"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setSettingsColumns((prev) => prev.map((c) => c.key === "grade"
                            ? { ...c, options: c.options?.filter((_, i) => i !== idx) }
                            : c))}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" variant="ghost" className="h-7 text-xs"
                      onClick={() => setSettingsColumns((prev) => prev.map((c) => c.key === "grade"
                        ? { ...c, options: [...(c.options ?? []), ""] }
                        : c))}>
                      <Plus className="h-3 w-3 mr-1" />
                      Ajouter un grade
                    </Button>
                  </div>
                )}
              </div>
            ))}
            <Button size="sm" variant="outline"
              onClick={() => setSettingsColumns((prev) => [...prev, { key: `custom_${Date.now()}`, label: "", builtin: false }])}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Ajouter une colonne
            </Button>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Annuler</Button>
            <Button onClick={saveSettings} disabled={settingsSaving}>
              {settingsSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — créer personnage */}
      <Dialog open={dialog === "create"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Créer mon personnage</DialogTitle></DialogHeader>
          <CharacterForm charFirstName={charFirstName} setCharFirstName={setCharFirstName}
            charLastName={charLastName} setCharLastName={setCharLastName} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Annuler</Button>
            <Button onClick={createCharacter} disabled={saving || !charFirstName.trim() || !charLastName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — modifier personnage */}
      <Dialog open={dialog === "edit"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier mon personnage</DialogTitle></DialogHeader>
          <CharacterForm charFirstName={charFirstName} setCharFirstName={setCharFirstName}
            charLastName={charLastName} setCharLastName={setCharLastName} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Annuler</Button>
            <Button onClick={saveEdit} disabled={saving || !charFirstName.trim() || !charLastName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — colonnes staff */}
      <Dialog open={dialog === "role"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialogTitle}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {columns.map((col) => {
              if (col.key === "grade") {
                const opts = col.options ?? []
                return (
                  <div key="grade" className="space-y-1">
                    <Label>{col.label}</Label>
                    {opts.length > 0 ? (
                      <Select value={gradeValue || "__none__"} onValueChange={(v) => setGradeValue(v === "__none__" ? "" : v)}>
                        <SelectTrigger><SelectValue placeholder={`— ${col.label} —`} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__"><span className="text-muted-foreground">— Aucun —</span></SelectItem>
                          {opts.filter(Boolean).map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={gradeValue} onChange={(e) => setGradeValue(e.target.value)}
                        placeholder="Ex: Sergent, Caporal…" />
                    )}
                  </div>
                )
              }
              if (col.key === "role") return (
                <div key="role" className="space-y-1">
                  <Label>{col.label}</Label>
                  <Input value={roleValue} onChange={(e) => setRoleValue(e.target.value)}
                    placeholder="Ex: Parachutiste, Sniper…" />
                </div>
              )
              return (
                <div key={col.key} className="space-y-1">
                  <Label>{col.label}</Label>
                  <Input
                    value={customFieldValues[col.key] ?? ""}
                    onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [col.key]: e.target.value }))}
                    placeholder={col.label}
                  />
                </div>
              )
            })}
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

function CharacterTable({
  characters, groups, columns, isStaff, currentUserId, onRole, onDelete, onAssign, emptyMessage,
}: {
  characters: RpCharacter[]
  groups: RpGroup[]
  columns: ColumnDef[]
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
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Personnage</TableHead>
            <TableHead>Joueur</TableHead>
            {columns.map((col) => (
              <TableHead key={col.key} className="hidden sm:table-cell">{col.label}</TableHead>
            ))}
            {isStaff && groups.length > 0 && <TableHead className="text-center">Groupe</TableHead>}
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {characters.map((char) => {
            const avatar = char.user.customAvatar ?? char.user.image
            const isOwn = char.user.id === currentUserId
            const cf = (char.customFields && typeof char.customFields === "object" ? char.customFields : {}) as Record<string, string>
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
                {columns.map((col) => {
                  const val = col.key === "grade" ? char.grade : col.key === "role" ? char.role : cf[col.key]
                  return (
                    <TableCell key={col.key} className="hidden sm:table-cell">
                      {val
                        ? <Badge variant={col.key === "grade" ? "outline" : "secondary"} className="text-xs">{val}</Badge>
                        : <span className="text-xs text-muted-foreground italic">—</span>}
                    </TableCell>
                  )
                })}
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
                      <Button size="icon" variant="ghost" className="h-7 w-7"
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

function CharacterForm({ charFirstName, setCharFirstName, charLastName, setCharLastName }: {
  charFirstName: string; setCharFirstName: (v: string) => void
  charLastName: string; setCharLastName: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label>Prénom</Label>
        <Input value={charFirstName} onChange={(e) => setCharFirstName(e.target.value)} placeholder="Ex: Jean" />
      </div>
      <div className="space-y-1">
        <Label>Nom</Label>
        <Input value={charLastName} onChange={(e) => setCharLastName(e.target.value.toUpperCase())} placeholder="Ex: DUPONT" />
      </div>
    </div>
  )
}
