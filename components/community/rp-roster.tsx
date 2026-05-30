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
import { Loader2, Plus, Trash2, Pencil, Sword, Users, ChevronRight, Settings } from "lucide-react"
import Link from "next/link"

export type ColumnDef = { key: string; label: string; builtin: boolean }

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: "grade", label: "Grade", builtin: true },
  { key: "role", label: "Fonction", builtin: true },
]

function parseColumns(raw: unknown): ColumnDef[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_COLUMNS
  return (raw as ColumnDef[]).map((c) => ({
    key: String(c.key ?? ""),
    label: String(c.label ?? ""),
    builtin: !!c.builtin,
  }))
}

interface RpUnit {
  id: string
  name: string
  description: string | null
  era: string | null
  columnConfig: unknown
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
  const [saving, setSaving] = useState(false)

  const [editUnit, setEditUnit] = useState<RpUnit | null>(null)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editEra, setEditEra] = useState("")
  const [editSaving, setEditSaving] = useState(false)

  const [settingsUnit, setSettingsUnit] = useState<RpUnit | null>(null)
  const [settingsColumns, setSettingsColumns] = useState<ColumnDef[]>([])
  const [settingsSaving, setSettingsSaving] = useState(false)

  function openEdit(unit: RpUnit, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setEditUnit(unit); setEditName(unit.name)
    setEditDesc(unit.description ?? ""); setEditEra(unit.era ?? "")
  }

  function openSettings(unit: RpUnit, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setSettingsUnit(unit)
    setSettingsColumns(parseColumns(unit.columnConfig))
  }

  function addCustomColumn() {
    setSettingsColumns((prev) => [
      ...prev,
      { key: `custom_${Date.now()}`, label: "", builtin: false },
    ])
  }

  function updateColumnLabel(key: string, label: string) {
    setSettingsColumns((prev) => prev.map((c) => c.key === key ? { ...c, label } : c))
  }

  function removeColumn(key: string) {
    setSettingsColumns((prev) => prev.filter((c) => c.key !== key))
  }

  async function saveSettings() {
    if (!settingsUnit) return
    if (settingsColumns.some((c) => !c.label.trim())) {
      toast.error("Tous les noms de colonnes sont obligatoires")
      return
    }
    setSettingsSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/units/${settingsUnit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnConfig: settingsColumns }),
      })
      if (!res.ok) throw new Error()
      toast.success("Paramètres sauvegardés")
      setSettingsUnit(null)
      router.refresh()
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSettingsSaving(false)
    }
  }

  async function createUnit() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/rp/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: desc.trim() || null, era: era.trim() || null }),
      })
      if (!res.ok) throw new Error()
      toast.success("Unité créée")
      setCreateDialog(false); setName(""); setDesc(""); setEra("")
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
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null, era: editEra.trim() || null }),
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
              <Link href={`/communities/${communitySlug}/rp/${unit.id}`}>
                <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sword className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-semibold truncate">{unit.name}</span>
                    </div>
                    {unit.era && <Badge variant="outline" className="text-xs">{unit.era}</Badge>}
                    {unit.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{unit.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
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
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => openSettings(unit, e)}
                    className="p-1 rounded hover:text-primary text-muted-foreground"
                    title="Paramètres du tableau"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => openEdit(unit, e)}
                    className="p-1 rounded hover:text-primary text-muted-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => deleteUnit(unit.id, e)}
                    className="p-1 rounded hover:text-destructive text-muted-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog paramètres colonnes */}
      <Dialog open={!!settingsUnit} onOpenChange={(open) => !open && setSettingsUnit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Paramètres — {settingsUnit?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Configurez les colonnes du tableau des effectifs.</p>
            <div className="space-y-2">
              {settingsColumns.map((col) => (
                <div key={col.key} className="flex items-center gap-2">
                  <div className="flex-1 space-y-0.5">
                    <Label className="text-xs text-muted-foreground">
                      {col.builtin ? "Colonne intégrée" : "Colonne personnalisée"}
                    </Label>
                    <Input
                      value={col.label}
                      onChange={(e) => updateColumnLabel(col.key, e.target.value)}
                      placeholder="Nom de la colonne"
                      className="h-8"
                    />
                  </div>
                  {!col.builtin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive mt-4"
                      onClick={() => removeColumn(col.key)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={addCustomColumn}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Ajouter une colonne
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsUnit(null)}>Annuler</Button>
            <Button onClick={saveSettings} disabled={settingsSaving}>
              {settingsSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Label>Période / Ère <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input value={era} onChange={(e) => setEra(e.target.value)} placeholder="Ex: WW2, Guerre Froide, Moderne…" />
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
              <Label>Période / Ère <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input value={editEra} onChange={(e) => setEditEra(e.target.value)} placeholder="Ex: WW2, Guerre Froide, Moderne…" />
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
