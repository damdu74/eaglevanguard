"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, Trash2, Check, Lock } from "lucide-react"
import { EAGLE_VANGUARD_PERMISSIONS, EAGLE_VANGUARD_PERMISSION_LABELS, type EagleVanguardPermission } from "@/lib/permissions"

interface EagleVanguardRank {
  id: string
  name: string
  abbreviation: string
  order: number
  color: string
  permissions: string[]
  isProtected: boolean
  category: string
}

interface Props {
  initialRanks: EagleVanguardRank[]
}

function RolesSection({ ranks, setRanks }: {
  ranks: EagleVanguardRank[]
  setRanks: React.Dispatch<React.SetStateAction<EagleVanguardRank[]>>
}) {
  const roleRanks = ranks.filter(r => r.category === "ROLE")

  const [selectedId, setSelectedId] = useState<string | null>(roleRanks[0]?.id ?? null)
  const selectedRank = roleRanks.find(r => r.id === selectedId) ?? null

  const [editName, setEditName] = useState(selectedRank?.name ?? "")
  const [editColor, setEditColor] = useState(selectedRank?.color ?? "#6366f1")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#6366f1")
  const [creating, setCreating] = useState(false)

  function selectRole(rank: EagleVanguardRank) {
    setSelectedId(rank.id)
    setEditName(rank.name)
    setEditColor(rank.color)
  }

  function togglePermission(perm: EagleVanguardPermission) {
    if (!selectedRank || selectedRank.isProtected) return
    setRanks(prev => prev.map(r => {
      if (r.id !== selectedRank.id) return r
      const has = r.permissions.includes(perm)
      return { ...r, permissions: has ? r.permissions.filter(p => p !== perm) : [...r.permissions, perm] }
    }))
  }

  async function saveRole() {
    if (!selectedRank) return
    setSaving(true)
    try {
      const res = await fetch(`/api/eagle-vanguard/ranks/${selectedRank.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, color: editColor, permissions: selectedRank.permissions }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setRanks(prev => prev.map(r => r.id === selectedRank.id ? updated : r))
      toast.success("Rôle sauvegardé")
    } catch { toast.error("Erreur lors de la sauvegarde") }
    finally { setSaving(false) }
  }

  async function deleteRole() {
    if (!selectedRank) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/eagle-vanguard/ranks/${selectedRank.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      const remaining = roleRanks.filter(r => r.id !== selectedRank.id)
      setRanks(prev => prev.filter(r => r.id !== selectedRank.id))
      setSelectedId(remaining[0]?.id ?? null)
      setEditName(remaining[0]?.name ?? "")
      setEditColor(remaining[0]?.color ?? "#6366f1")
      toast.success("Rôle supprimé")
    } catch { toast.error("Erreur lors de la suppression") }
    finally { setDeleting(false) }
  }

  async function createRole() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/eagle-vanguard/ranks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          abbreviation: newName.trim().slice(0, 3).toUpperCase(),
          order: roleRanks.length,
          color: newColor,
          category: "ROLE",
        }),
      })
      if (!res.ok) throw new Error()
      const rank = await res.json()
      setRanks(prev => [...prev, rank])
      setNewName("")
      setNewColor("#6366f1")
      selectRole(rank)
      toast.success("Rôle créé")
    } catch { toast.error("Erreur lors de la création") }
    finally { setCreating(false) }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rôles</CardTitle>
        <CardDescription className="text-xs">Positions hiérarchiques avec permissions sur la plateforme.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex" style={{ minHeight: 380 }}>

          {/* Panneau gauche — liste des rôles */}
          <div className="w-44 border-r flex flex-col shrink-0">
            <div className="flex-1 overflow-y-auto">
              {roleRanks.map(rank => (
                <button
                  key={rank.id}
                  onClick={() => selectRole(rank)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 ${selectedId === rank.id ? "bg-muted" : ""}`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: rank.color }} />
                  <span className="text-sm truncate flex-1">{rank.name}</span>
                  {rank.isProtected && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                </button>
              ))}
            </div>

            {/* Ajout d'un nouveau rôle */}
            <div className="border-t p-2 space-y-1.5">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createRole()}
                placeholder="Nouveau rôle"
                className="h-7 text-xs"
              />
              <div className="flex items-center gap-1.5">
                <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-7 w-8 cursor-pointer rounded border border-border" />
                <Button size="sm" className="h-7 flex-1 text-xs px-2" onClick={createRole} disabled={creating || !newName.trim()}>
                  {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Plus className="h-3 w-3 mr-1" />Créer</>}
                </Button>
              </div>
            </div>
          </div>

          {/* Panneau droit — détails du rôle sélectionné */}
          <div className="flex-1 p-4 overflow-y-auto">
            {!selectedRank ? (
              <p className="text-sm text-muted-foreground">Sélectionnez un rôle.</p>
            ) : selectedRank.isProtected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: selectedRank.color }} />
                  <span className="font-semibold text-sm">{selectedRank.name}</span>
                  <span className="ml-auto text-xs border rounded px-1.5 py-0.5 text-muted-foreground">Protégé</span>
                </div>
                <Separator />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permissions</p>
                <div className="space-y-0.5">
                  {EAGLE_VANGUARD_PERMISSIONS.map(perm => (
                    <div key={perm} className="flex items-center justify-between px-3 py-2.5 rounded-md">
                      <span className="text-sm">{EAGLE_VANGUARD_PERMISSION_LABELS[perm]}</span>
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Éditeur nom + couleur */}
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editColor}
                    onChange={e => setEditColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border border-border shrink-0"
                  />
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="h-8 text-sm font-semibold"
                  />
                </div>

                <Separator />

                {/* Permissions */}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permissions</p>
                <div className="space-y-0.5">
                  {EAGLE_VANGUARD_PERMISSIONS.map(perm => (
                    <div
                      key={perm}
                      className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm">{EAGLE_VANGUARD_PERMISSION_LABELS[perm]}</span>
                      <Switch
                        checked={selectedRank.permissions.includes(perm)}
                        onCheckedChange={() => togglePermission(perm)}
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteRole}
                    disabled={deleting || saving}
                  >
                    {deleting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                    Supprimer
                  </Button>
                  <Button size="sm" onClick={saveRole} disabled={saving || deleting}>
                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Sauvegarder
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FunctionsSection({ ranks, setRanks }: {
  ranks: EagleVanguardRank[]
  setRanks: React.Dispatch<React.SetStateAction<EagleVanguardRank[]>>
}) {
  const fnRanks = ranks.filter(r => r.category === "FUNCTION")

  const [selectedId, setSelectedId] = useState<string | null>(fnRanks[0]?.id ?? null)
  const selectedFn = fnRanks.find(r => r.id === selectedId) ?? null

  const [editName, setEditName] = useState(selectedFn?.name ?? "")
  const [editColor, setEditColor] = useState(selectedFn?.color ?? "#6366f1")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#6366f1")
  const [creating, setCreating] = useState(false)

  function selectFn(rank: EagleVanguardRank) {
    setSelectedId(rank.id)
    setEditName(rank.name)
    setEditColor(rank.color)
  }

  async function saveFn() {
    if (!selectedFn) return
    setSaving(true)
    try {
      const res = await fetch(`/api/eagle-vanguard/ranks/${selectedFn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, color: editColor }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setRanks(prev => prev.map(r => r.id === selectedFn.id ? updated : r))
      toast.success("Fonction sauvegardée")
    } catch { toast.error("Erreur lors de la sauvegarde") }
    finally { setSaving(false) }
  }

  async function deleteFn() {
    if (!selectedFn) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/eagle-vanguard/ranks/${selectedFn.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      const remaining = fnRanks.filter(r => r.id !== selectedFn.id)
      setRanks(prev => prev.filter(r => r.id !== selectedFn.id))
      setSelectedId(remaining[0]?.id ?? null)
      setEditName(remaining[0]?.name ?? "")
      setEditColor(remaining[0]?.color ?? "#6366f1")
      toast.success("Supprimé")
    } catch { toast.error("Erreur lors de la suppression") }
    finally { setDeleting(false) }
  }

  async function createFn() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/eagle-vanguard/ranks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          abbreviation: newName.trim().slice(0, 3).toUpperCase(),
          order: fnRanks.length,
          color: newColor,
          category: "FUNCTION",
        }),
      })
      if (!res.ok) throw new Error()
      const rank = await res.json()
      setRanks(prev => [...prev, rank])
      setNewName("")
      setNewColor("#6366f1")
      selectFn(rank)
      toast.success("Fonction créée")
    } catch { toast.error("Erreur lors de la création") }
    finally { setCreating(false) }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fonctions</CardTitle>
        <CardDescription className="text-xs">Responsabilités et spécialités — décoratif uniquement.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex" style={{ minHeight: 380 }}>

          {/* Panneau gauche — liste des fonctions */}
          <div className="w-44 border-r flex flex-col shrink-0">
            <div className="flex-1 overflow-y-auto">
              {fnRanks.length === 0 && (
                <p className="text-xs text-muted-foreground px-3 py-4 text-center">Aucune fonction.</p>
              )}
              {fnRanks.map(rank => (
                <button
                  key={rank.id}
                  onClick={() => selectFn(rank)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 ${selectedId === rank.id ? "bg-muted" : ""}`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: rank.color }} />
                  <span className="text-sm truncate flex-1">{rank.name}</span>
                </button>
              ))}
            </div>

            {/* Ajout d'une nouvelle fonction */}
            <div className="border-t p-2 space-y-1.5">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createFn()}
                placeholder="Nouvelle fonction"
                className="h-7 text-xs"
              />
              <div className="flex items-center gap-1.5">
                <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-7 w-8 cursor-pointer rounded border border-border" />
                <Button size="sm" className="h-7 flex-1 text-xs px-2" onClick={createFn} disabled={creating || !newName.trim()}>
                  {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Plus className="h-3 w-3 mr-1" />Créer</>}
                </Button>
              </div>
            </div>
          </div>

          {/* Panneau droit — détails de la fonction sélectionnée */}
          <div className="flex-1 p-4">
            {!selectedFn ? (
              <p className="text-sm text-muted-foreground">Sélectionnez une fonction.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editColor}
                    onChange={e => setEditColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border border-border shrink-0"
                  />
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="h-8 text-sm font-semibold"
                  />
                </div>

                <Separator />

                <p className="text-xs text-muted-foreground">Les fonctions sont décoratives et n&apos;accordent aucune permission sur la plateforme.</p>

                <Separator />

                <div className="flex items-center justify-between">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteFn}
                    disabled={deleting || saving}
                  >
                    {deleting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                    Supprimer
                  </Button>
                  <Button size="sm" onClick={saveFn} disabled={saving || deleting}>
                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Sauvegarder
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EagleVanguardRanksManager({ initialRanks }: Props) {
  const [ranks, setRanks] = useState<EagleVanguardRank[]>(initialRanks)

  return (
    <div className="grid grid-cols-2 gap-4">
      <RolesSection ranks={ranks} setRanks={setRanks} />
      <FunctionsSection ranks={ranks} setRanks={setRanks} />
    </div>
  )
}
