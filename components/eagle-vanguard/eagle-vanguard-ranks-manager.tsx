"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, Trash2, Check, Lock, GripVertical, ChevronRight } from "lucide-react"
import { EAGLE_VANGUARD_PERMISSIONS, EAGLE_VANGUARD_PERMISSION_LABELS, type EagleVanguardPermission } from "@/lib/permissions"

interface EagleVanguardRank {
  id: string
  name: string
  abbreviation: string
  order: number
  color: string
  permissions: string[]
  assignableRankIds: string[]
  assignableFunctionIds: string[]
  isProtected: boolean
  isHidden: boolean
  category: string
}

interface Props {
  initialRanks: EagleVanguardRank[]
  isSuperAdmin: boolean
}

function useSortable(
  items: EagleVanguardRank[],
  onReorder: (reordered: EagleVanguardRank[]) => void
) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  function onDragStart(e: React.DragEvent, id: string) {
    setDragId(id)
    e.dataTransfer.effectAllowed = "move"
  }

  function onDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    if (id !== dragId) setDragOverId(id)
  }

  function onDrop(e: React.DragEvent, id: string) {
    e.preventDefault()
    if (!dragId || dragId === id) return
    const fromIdx = items.findIndex(r => r.id === dragId)
    const toIdx = items.findIndex(r => r.id === id)
    if (fromIdx < 0 || toIdx < 0) return
    const next = [...items]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    onReorder(next.map((r, i) => ({ ...r, order: i })))
    setDragId(null)
    setDragOverId(null)
  }

  function onDragEnd() {
    setDragId(null)
    setDragOverId(null)
  }

  return { dragId, dragOverId, onDragStart, onDragOver, onDrop, onDragEnd }
}

async function saveOrder(items: EagleVanguardRank[]) {
  try {
    const res = await fetch("/api/eagle-vanguard/ranks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items.map(r => ({ id: r.id, order: r.order }))),
    })
    if (!res.ok) throw new Error()
  } catch {
    toast.error("Erreur lors de la sauvegarde de l'ordre")
  }
}

function RolesSection({ ranks, setRanks, isSuperAdmin }: {
  ranks: EagleVanguardRank[]
  setRanks: React.Dispatch<React.SetStateAction<EagleVanguardRank[]>>
  isSuperAdmin: boolean
}) {
  const roleRanks = ranks.filter(r => r.category === "ROLE" && (!r.isHidden || isSuperAdmin))

  const [selectedId, setSelectedId] = useState<string | null>(roleRanks[0]?.id ?? null)
  const selectedRank = roleRanks.find(r => r.id === selectedId) ?? null

  const [editName, setEditName] = useState(selectedRank?.name ?? "")
  const [editColor, setEditColor] = useState(selectedRank?.color ?? "#6366f1")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#6366f1")
  const [creating, setCreating] = useState(false)
  const [assignableOpen, setAssignableOpen] = useState(false)
  const [assignableFnOpen, setAssignableFnOpen] = useState(false)

  const { dragId, dragOverId, onDragStart, onDragOver, onDrop, onDragEnd } = useSortable(
    roleRanks,
    (reordered) => {
      setRanks(prev => {
        const others = prev.filter(r => r.category !== "ROLE")
        return [...others, ...reordered]
      })
      saveOrder(reordered)
    }
  )

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

  function toggleAssignableFunction(fnId: string) {
    if (!selectedRank || selectedRank.isProtected) return
    setRanks(prev => prev.map(r => {
      if (r.id !== selectedRank.id) return r
      const has = r.assignableFunctionIds.includes(fnId)
      return { ...r, assignableFunctionIds: has ? r.assignableFunctionIds.filter(id => id !== fnId) : [...r.assignableFunctionIds, fnId] }
    }))
  }

  function toggleAssignable(rankId: string) {
    if (!selectedRank || selectedRank.isProtected) return
    setRanks(prev => prev.map(r => {
      if (r.id !== selectedRank.id) return r
      const has = r.assignableRankIds.includes(rankId)
      return { ...r, assignableRankIds: has ? r.assignableRankIds.filter(id => id !== rankId) : [...r.assignableRankIds, rankId] }
    }))
  }

  async function saveRole() {
    if (!selectedRank) return
    setSaving(true)
    try {
      const res = await fetch(`/api/eagle-vanguard/ranks/${selectedRank.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, color: editColor, permissions: selectedRank.permissions, assignableRankIds: selectedRank.assignableRankIds, assignableFunctionIds: selectedRank.assignableFunctionIds }),
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
                <div
                  key={rank.id}
                  draggable
                  onDragStart={e => onDragStart(e, rank.id)}
                  onDragOver={e => onDragOver(e, rank.id)}
                  onDrop={e => onDrop(e, rank.id)}
                  onDragEnd={onDragEnd}
                  className={`flex items-center gap-1 transition-colors border-t-2 first:border-t-0 ${dragOverId === rank.id ? "border-t-primary" : "border-t-transparent"} ${dragId === rank.id ? "opacity-40" : ""}`}
                >
                  <span className="pl-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground shrink-0">
                    <GripVertical className="h-3.5 w-3.5" />
                  </span>
                  <button
                    onClick={() => selectRole(rank)}
                    className={`flex-1 flex items-center gap-2 pr-3 py-2.5 text-left transition-colors hover:bg-muted/50 min-w-0 ${selectedId === rank.id ? "bg-muted" : ""} ${rank.isHidden ? "opacity-40" : ""}`}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: rank.color }} />
                    <span className="text-sm truncate flex-1">{rank.name}</span>
                    {rank.isProtected && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                  </button>
                </div>
              ))}
            </div>

            {/* Ajout d'un nouveau rôle */}
            <div className="border-t p-2 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-7 w-8 cursor-pointer rounded border border-border shrink-0" />
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createRole()}
                  placeholder="Nouveau rôle"
                  className="h-7 text-xs"
                />
              </div>
              <Button size="sm" className="h-7 w-full text-xs" onClick={createRole} disabled={creating || !newName.trim()}>
                {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Plus className="h-3 w-3 mr-1" />Créer</>}
              </Button>
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
                <div className="flex items-center gap-2">
                  <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded border border-border shrink-0" />
                  <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-sm font-semibold" />
                </div>
                <Separator />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permissions</p>
                <div className="space-y-0.5">
                  {EAGLE_VANGUARD_PERMISSIONS.map(perm => (
                    <div key={perm}>
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm">{EAGLE_VANGUARD_PERMISSION_LABELS[perm]}</span>
                          {perm === "MANAGE_ROLES" && (
                            <button
                              onClick={() => setAssignableOpen(o => !o)}
                              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            >
                              <ChevronRight className={`h-3.5 w-3.5 transition-transform ${assignableOpen ? "rotate-90" : ""}`} />
                            </button>
                          )}
                          {perm === "MANAGE_RANKS" && (
                            <button
                              onClick={() => setAssignableFnOpen(o => !o)}
                              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            >
                              <ChevronRight className={`h-3.5 w-3.5 transition-transform ${assignableFnOpen ? "rotate-90" : ""}`} />
                            </button>
                          )}
                        </div>
                        <Switch checked={selectedRank.permissions.includes(perm)} onCheckedChange={() => togglePermission(perm)} />
                      </div>
                      {perm === "MANAGE_RANKS" && assignableFnOpen && (
                        <div className="ml-6 mb-1 border-l pl-3 space-y-0.5">
                          {ranks.filter(r => r.category === "FUNCTION").map(r => (
                            <div key={r.id} className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                                <span className="text-sm">{r.name}</span>
                              </div>
                              <Switch
                                checked={selectedRank.assignableFunctionIds.includes(r.id)}
                                onCheckedChange={() => toggleAssignableFunction(r.id)}
                              />
                            </div>
                          ))}
                          {ranks.filter(r => r.category === "FUNCTION").length === 0 && (
                            <p className="text-xs text-muted-foreground px-2 py-1">Aucune fonction disponible.</p>
                          )}
                        </div>
                      )}
                      {perm === "MANAGE_ROLES" && assignableOpen && (
                        <div className="ml-6 mb-1 border-l pl-3 space-y-0.5">
                          {roleRanks.filter(r => r.id !== selectedRank.id).map(r => (
                            <div key={r.id} className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                                <span className="text-sm">{r.name}</span>
                                {r.isProtected && <Lock className="h-3 w-3 text-muted-foreground" />}
                              </div>
                              <Switch
                                checked={selectedRank.assignableRankIds.includes(r.id)}
                                onCheckedChange={() => toggleAssignable(r.id)}
                              />
                            </div>
                          ))}
                          {roleRanks.filter(r => r.id !== selectedRank.id).length === 0 && (
                            <p className="text-xs text-muted-foreground px-2 py-1">Aucun autre rôle disponible.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <Button variant="destructive" size="sm" onClick={deleteRole} disabled={deleting || saving}>
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

  const { dragId, dragOverId, onDragStart, onDragOver, onDrop, onDragEnd } = useSortable(
    fnRanks,
    (reordered) => {
      setRanks(prev => {
        const others = prev.filter(r => r.category !== "FUNCTION")
        return [...others, ...reordered]
      })
      saveOrder(reordered)
    }
  )

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
                <div
                  key={rank.id}
                  draggable
                  onDragStart={e => onDragStart(e, rank.id)}
                  onDragOver={e => onDragOver(e, rank.id)}
                  onDrop={e => onDrop(e, rank.id)}
                  onDragEnd={onDragEnd}
                  className={`flex items-center gap-1 transition-colors border-t-2 first:border-t-0 ${dragOverId === rank.id ? "border-t-primary" : "border-t-transparent"} ${dragId === rank.id ? "opacity-40" : ""}`}
                >
                  <span className="pl-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground shrink-0">
                    <GripVertical className="h-3.5 w-3.5" />
                  </span>
                  <button
                    onClick={() => selectFn(rank)}
                    className={`flex-1 flex items-center gap-2 pr-3 py-2.5 text-left transition-colors hover:bg-muted/50 min-w-0 ${selectedId === rank.id ? "bg-muted" : ""}`}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: rank.color }} />
                    <span className="text-sm truncate flex-1">{rank.name}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Ajout d'une nouvelle fonction */}
            <div className="border-t p-2 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-7 w-8 cursor-pointer rounded border border-border shrink-0" />
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createFn()}
                  placeholder="Nouvelle fonction"
                  className="h-7 text-xs"
                />
              </div>
              <Button size="sm" className="h-7 w-full text-xs" onClick={createFn} disabled={creating || !newName.trim()}>
                {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Plus className="h-3 w-3 mr-1" />Créer</>}
              </Button>
            </div>
          </div>

          {/* Panneau droit — détails de la fonction sélectionnée */}
          <div className="flex-1 p-4">
            {!selectedFn ? (
              <p className="text-sm text-muted-foreground">Sélectionnez une fonction.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded border border-border shrink-0" />
                  <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-sm font-semibold" />
                </div>
                <Separator />
                <p className="text-xs text-muted-foreground">Les fonctions sont décoratives et n&apos;accordent aucune permission sur la plateforme.</p>
                <Separator />
                <div className="flex items-center justify-between">
                  <Button variant="destructive" size="sm" onClick={deleteFn} disabled={deleting || saving}>
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
