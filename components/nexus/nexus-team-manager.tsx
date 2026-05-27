"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Loader2, Plus, Trash2, Pencil, Check, X,
  Users, Building2, FileText, Shield,
  UserPlus, UserMinus, Search,
} from "lucide-react"

interface Stats {
  totalUsers: number
  totalCommunities: number
  pendingApplications: number
  teamSize: number
}

interface NexusRank {
  id: string
  name: string
  abbreviation: string
  order: number
  color: string
}

interface Member {
  id: string
  steamName: string | null
  discordName: string | null
  name: string | null
  customAvatar: string | null
  steamAvatar: string | null
  discordAvatar: string | null
  nexusRankId: string | null
  nexusRank: NexusRank | null
}

interface SearchUser {
  id: string
  steamName: string | null
  discordName: string | null
  name: string | null
  customAvatar: string | null
  steamAvatar: string | null
  discordAvatar: string | null
  image: string | null
}

interface Props {
  initialRanks: NexusRank[]
  initialMembers: Member[]
  stats: Stats
  currentUserId: string
}

export function NexusTeamManager({ initialRanks, initialMembers, stats, currentUserId }: Props) {
  const [ranks, setRanks] = useState<NexusRank[]>(initialRanks)
  const [members, setMembers] = useState<Member[]>(initialMembers)

  // Grade — création
  const [newName, setNewName] = useState("")
  const [newAbbr, setNewAbbr] = useState("")
  const [newColor, setNewColor] = useState("#6366f1")
  const [creating, setCreating] = useState(false)

  // Grade — édition
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editAbbr, setEditAbbr] = useState("")
  const [editColor, setEditColor] = useState("")
  const [editOrder, setEditOrder] = useState(0)
  const [saving, setSaving] = useState(false)

  // Membres
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Recherche / Promotion
  const [searchQ, setSearchQ] = useState("")
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searching, setSearching] = useState(false)
  const [promotingId, setPromotingId] = useState<string | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    clearTimeout(searchTimer.current)
    if (searchQ.trim().length < 2) { setSearchResults([]); return }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/nexus/users/search?q=${encodeURIComponent(searchQ.trim())}`)
        const data = await res.json()
        setSearchResults(Array.isArray(data) ? data : [])
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(searchTimer.current)
  }, [searchQ])

  // ——— Grades ———

  async function createRank() {
    if (!newName.trim() || !newAbbr.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/nexus/ranks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), abbreviation: newAbbr.trim(), order: ranks.length, color: newColor }),
      })
      if (!res.ok) throw new Error()
      const rank = await res.json()
      setRanks(prev => [...prev, rank])
      setNewName(""); setNewAbbr(""); setNewColor("#6366f1")
      toast.success("Grade créé")
    } catch { toast.error("Erreur lors de la création") }
    finally { setCreating(false) }
  }

  function startEdit(rank: NexusRank) {
    setEditingId(rank.id); setEditName(rank.name)
    setEditAbbr(rank.abbreviation); setEditColor(rank.color); setEditOrder(rank.order)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/nexus/ranks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, abbreviation: editAbbr, color: editColor, order: editOrder }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setRanks(prev => prev.map(r => r.id === id ? updated : r).sort((a, b) => a.order - b.order))
      setEditingId(null)
      toast.success("Grade modifié")
    } catch { toast.error("Erreur lors de la modification") }
    finally { setSaving(false) }
  }

  async function deleteRank(id: string) {
    try {
      const res = await fetch(`/api/nexus/ranks/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setRanks(prev => prev.filter(r => r.id !== id))
      setMembers(prev => prev.map(m => m.nexusRankId === id ? { ...m, nexusRankId: null, nexusRank: null } : m))
      toast.success("Grade supprimé")
    } catch { toast.error("Erreur lors de la suppression") }
  }

  // ——— Membres ———

  async function assignRank(memberId: string, nexusRankId: string | null) {
    setAssigningId(memberId)
    try {
      const res = await fetch(`/api/nexus/members/${memberId}/rank`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nexusRankId }),
      })
      if (!res.ok) throw new Error()
      const rank = nexusRankId ? ranks.find(r => r.id === nexusRankId) ?? null : null
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, nexusRankId, nexusRank: rank } : m))
      toast.success("Grade assigné")
    } catch { toast.error("Erreur lors de l'assignation") }
    finally { setAssigningId(null) }
  }

  async function removeMember(memberId: string) {
    if (memberId === currentUserId) {
      toast.error("Vous ne pouvez pas vous retirer vous-même")
      return
    }
    setRemovingId(memberId)
    try {
      const res = await fetch(`/api/nexus/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isNexusTeam: false }),
      })
      if (!res.ok) throw new Error()
      setMembers(prev => prev.filter(m => m.id !== memberId))
      toast.success("Membre retiré de la NEXUS Team")
    } catch { toast.error("Erreur lors du retrait") }
    finally { setRemovingId(null) }
  }

  async function promoteMember(user: SearchUser) {
    setPromotingId(user.id)
    try {
      const res = await fetch(`/api/nexus/members/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isNexusTeam: true }),
      })
      if (!res.ok) throw new Error()
      const newMember: Member = {
        id: user.id,
        steamName: user.steamName,
        discordName: user.discordName,
        name: user.name,
        customAvatar: user.customAvatar,
        steamAvatar: user.steamAvatar,
        discordAvatar: user.discordAvatar,
        nexusRankId: null,
        nexusRank: null,
      }
      setMembers(prev => [...prev, newMember])
      setSearchResults(prev => prev.filter(u => u.id !== user.id))
      setSearchQ("")
      const displayName = user.steamName ?? user.discordName ?? user.name ?? "Utilisateur"
      toast.success(`${displayName} ajouté à la NEXUS Team`)
    } catch { toast.error("Erreur lors de la promotion") }
    finally { setPromotingId(null) }
  }

  // ——— Stats ———

  const statItems = [
    { label: "Membres NEXUS", value: members.length, icon: Shield, color: "text-indigo-400" },
    { label: "Utilisateurs", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Communautés", value: stats.totalCommunities, icon: Building2, color: "text-emerald-400" },
    { label: "Candidatures en attente", value: stats.pendingApplications, icon: FileText, color: "text-orange-400" },
  ]

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statItems.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 py-4 px-4">
              <Icon className={`h-5 w-5 shrink-0 ${color}`} />
              <div>
                <p className="text-xl font-bold leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Membres */}
      <Card>
        <CardHeader>
          <CardTitle>Membres NEXUS Team</CardTitle>
          <CardDescription>Gérez les membres et leurs grades. Ajoutez ou retirez des utilisateurs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun membre NEXUS Team.</p>
          )}
          {members.map(member => {
            const displayName = member.steamName ?? member.discordName ?? member.name ?? "Membre"
            const avatar = member.customAvatar ?? member.steamAvatar ?? member.discordAvatar
            const isSelf = member.id === currentUserId
            return (
              <div key={member.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={avatar ?? undefined} />
                    <AvatarFallback className="text-xs">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{displayName}</p>
                      {isSelf && <span className="text-xs text-muted-foreground">(vous)</span>}
                    </div>
                    {member.nexusRank && (
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: member.nexusRank.color }}>
                        {member.nexusRank.abbreviation}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {assigningId === member.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  <Select
                    value={member.nexusRankId ?? "none"}
                    onValueChange={val => assignRank(member.id, val === "none" ? null : val)}
                    disabled={assigningId === member.id}
                  >
                    <SelectTrigger className="w-40 h-8 text-xs">
                      <SelectValue placeholder="Aucun grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun grade</SelectItem>
                      {ranks.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          <span className="flex items-center gap-2">
                            <span className="text-xs font-mono px-1 rounded text-white" style={{ backgroundColor: r.color }}>{r.abbreviation}</span>
                            {r.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => removeMember(member.id)}
                    disabled={removingId === member.id || isSelf}
                    title={isSelf ? "Impossible de vous retirer vous-même" : "Retirer de la NEXUS Team"}
                  >
                    {removingId === member.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <UserMinus className="h-3.5 w-3.5" />
                    }
                  </Button>
                </div>
              </div>
            )
          })}

          <Separator />

          {/* Ajouter un membre */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Ajouter un membre</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="pl-8 h-8 text-sm"
              />
              {searching && <Loader2 className="absolute right-2.5 top-2 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            {searchResults.length > 0 && (
              <div className="rounded-md border border-border bg-background shadow-sm divide-y divide-border overflow-hidden">
                {searchResults.map(user => {
                  const name = user.steamName ?? user.discordName ?? user.name ?? "Utilisateur"
                  const avatar = user.customAvatar ?? user.steamAvatar ?? user.discordAvatar ?? user.image
                  return (
                    <div key={user.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarImage src={avatar ?? undefined} />
                          <AvatarFallback className="text-xs">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm truncate">{name}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 shrink-0"
                        onClick={() => promoteMember(user)}
                        disabled={promotingId === user.id}
                      >
                        {promotingId === user.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <><UserPlus className="h-3 w-3" />Promouvoir</>
                        }
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
            {searchQ.trim().length >= 2 && !searching && searchResults.length === 0 && (
              <p className="text-xs text-muted-foreground">Aucun utilisateur trouvé.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grades */}
      <Card>
        <CardHeader>
          <CardTitle>Grades NEXUS</CardTitle>
          <CardDescription>Définissez la hiérarchie interne de l&apos;équipe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ranks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun grade créé.</p>
          )}
          {ranks.map(rank => (
            <div key={rank.id}>
              {editingId === rank.id ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nom" className="w-40 h-8 text-sm" />
                  <Input value={editAbbr} onChange={e => setEditAbbr(e.target.value)} placeholder="Abrév." className="w-20 h-8 text-sm" />
                  <Input type="number" value={editOrder} onChange={e => setEditOrder(Number(e.target.value))} placeholder="Ordre" className="w-20 h-8 text-sm" />
                  <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border" />
                  <Button size="sm" className="h-8" onClick={() => saveEdit(rank.id)} disabled={saving}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono px-2 py-0.5 rounded font-bold text-white" style={{ backgroundColor: rank.color }}>
                      {rank.abbreviation}
                    </span>
                    <span className="text-sm font-medium">{rank.name}</span>
                    <span className="text-xs text-muted-foreground">#{rank.order}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(rank)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteRank(rank.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Nouveau grade</Label>
            <div className="flex items-center gap-2 flex-wrap">
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nom du grade" className="w-44 h-8 text-sm" />
              <Input value={newAbbr} onChange={e => setNewAbbr(e.target.value)} placeholder="Abrév." className="w-20 h-8 text-sm" maxLength={6} />
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border" title="Couleur" />
              <Button size="sm" className="h-8" onClick={createRank} disabled={creating || !newName.trim() || !newAbbr.trim()}>
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5 mr-1" />Créer</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
