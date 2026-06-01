"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { COMMUNITY_PERMISSIONS, PERMISSION_LABELS, type CommunityPermission } from "@/lib/permissions"

interface CommunityRole {
  id: string
  name: string
  color: string
  permissions: string[]
  order: number
  _count: { memberships: number }
}

interface Props {
  communitySlug: string
  initialRoles: CommunityRole[]
}

export function RolesManager({ communitySlug, initialRoles }: Props) {
  const [roles, setRoles] = useState<CommunityRole[]>(initialRoles)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#6366f1")

  const apiBase = `/api/communities/${communitySlug}/roles`

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor, permissions: [], order: roles.length }),
      })
      if (!res.ok) throw new Error()
      const role = await res.json()
      setRoles((prev) => [...prev, role])
      setNewName("")
      setNewColor("#6366f1")
      toast.success("Rôle créé")
    } catch {
      toast.error("Erreur lors de la création")
    } finally {
      setCreating(false)
    }
  }

  async function handleSave(role: CommunityRole) {
    setSaving(role.id)
    try {
      const res = await fetch(`${apiBase}/${role.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: role.name, color: role.color, permissions: role.permissions }),
      })
      if (!res.ok) throw new Error()
      toast.success("Rôle sauvegardé")
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(null)
    }
  }

  async function handleDelete(roleId: string) {
    const role = roles.find((r) => r.id === roleId)
    if (!role) return
    if (role._count.memberships > 0) {
      if (!confirm(`Ce rôle est attribué à ${role._count.memberships} membre(s). Ils deviendront des membres standards. Continuer ?`)) return
    }
    try {
      const res = await fetch(`${apiBase}/${roleId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setRoles((prev) => prev.filter((r) => r.id !== roleId))
      toast.success("Rôle supprimé")
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  function togglePermission(roleId: string, permission: CommunityPermission) {
    setRoles((prev) => prev.map((r) => {
      if (r.id !== roleId) return r
      const has = r.permissions.includes(permission)
      return { ...r, permissions: has ? r.permissions.filter((p) => p !== permission) : [...r.permissions, permission] }
    }))
  }

  function updateField(roleId: string, field: "name" | "color", value: string) {
    setRoles((prev) => prev.map((r) => r.id === roleId ? { ...r, [field]: value } : r))
  }

  return (
    <div className="space-y-4">
      {/* Rôles fixes (info) */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rôles système (non modifiables)</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { name: "Propriétaire", color: "#f59e0b", desc: "Accès total" },
            { name: "Membre", color: "#6b7280", desc: "Accès standard" },
            { name: "Nouveau Membre", color: "#9ca3af", desc: "Promu automatiquement après 7j" },
          ].map((r) => (
            <div key={r.name} className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm" style={{ borderColor: r.color, color: r.color, backgroundColor: `${r.color}15` }}>
              <span className="font-medium">{r.name}</span>
              <span className="text-xs opacity-70">— {r.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rôles personnalisés */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rôles personnalisés</p>

        {roles.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">Aucun rôle personnalisé. Créez-en un ci-dessous.</p>
        )}

        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
                  <span className="font-medium text-sm truncate">{role.name}</span>
                  {role._count.memberships > 0 && (
                    <Badge variant="secondary" className="text-xs shrink-0">{role._count.memberships} membre{role._count.memberships > 1 ? "s" : ""}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded === role.id ? null : role.id)}>
                    {expanded === role.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(role.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expanded === role.id && (
              <CardContent className="pt-0 pb-4 px-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nom du rôle</Label>
                    <Input className="mt-1 h-8 text-sm" value={role.name} onChange={(e) => updateField(role.id, "name", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Couleur</Label>
                    <div className="flex gap-2 mt-1">
                      <input type="color" value={role.color} onChange={(e) => updateField(role.id, "color", e.target.value)} className="h-8 w-10 rounded border cursor-pointer" />
                      <Input className="h-8 text-sm font-mono" value={role.color} onChange={(e) => updateField(role.id, "color", e.target.value)} />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Permissions</Label>
                  <div className="space-y-2">
                    {COMMUNITY_PERMISSIONS.map((perm) => (
                      <div key={perm} className="flex items-center justify-between">
                        <span className="text-sm">{PERMISSION_LABELS[perm]}</span>
                        <Switch
                          checked={role.permissions.includes(perm)}
                          onCheckedChange={() => togglePermission(role.id, perm)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button size="sm" onClick={() => handleSave(role)} disabled={saving === role.id}>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {saving === role.id ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Créer un rôle */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">Nouveau rôle</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-4 px-4">
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              className="h-8 text-sm flex-1"
              placeholder="Nom du rôle..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-8 w-10 rounded border cursor-pointer shrink-0"
            />
            <Button type="submit" size="sm" disabled={creating || !newName.trim()}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Créer
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
