"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, UserPlus, UserMinus, Search, Lock, X } from "lucide-react"

interface EagleVanguardRank {
  id: string
  name: string
  abbreviation: string
  order: number
  color: string
  isProtected: boolean
  isHidden: boolean
  category: string
}

interface Member {
  id: string
  steamName: string | null
  discordName: string | null
  name: string | null
  customAvatar: string | null
  steamAvatar: string | null
  discordAvatar: string | null
  eagleVanguardRankId: string | null
  eagleVanguardRank: EagleVanguardRank | null
  eagleVanguardFunctions: EagleVanguardRank[]
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
  initialRanks: EagleVanguardRank[]
  initialMembers: Member[]
  currentUserId: string
  isSuperAdmin: boolean
}

export function EagleVanguardMembersManager({ initialRanks, initialMembers, currentUserId, isSuperAdmin }: Props) {
  const [ranks] = useState<EagleVanguardRank[]>(initialRanks)
  const [members, setMembers] = useState<Member[]>(initialMembers)

  const roles = ranks.filter(r => r.category === "ROLE" && !r.isHidden)
  const functions = ranks.filter(r => r.category === "FUNCTION")

  const [assigningRoleId, setAssigningRoleId] = useState<string | null>(null)
  const [assigningFuncId, setAssigningFuncId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

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
        const res = await fetch(`/api/eagle-vanguard/users/search?q=${encodeURIComponent(searchQ.trim())}`)
        const data = await res.json()
        setSearchResults(Array.isArray(data) ? data : [])
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(searchTimer.current)
  }, [searchQ])

  async function assignRole(memberId: string, eagleVanguardRankId: string | null) {
    setAssigningRoleId(memberId)
    try {
      const res = await fetch(`/api/eagle-vanguard/members/${memberId}/rank`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eagleVanguardRankId }),
      })
      if (!res.ok) throw new Error()
      const rank = eagleVanguardRankId ? roles.find(r => r.id === eagleVanguardRankId) ?? null : null
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, eagleVanguardRankId, eagleVanguardRank: rank } : m))
      toast.success("Rôle assigné")
    } catch { toast.error("Erreur lors de l'assignation du rôle") }
    finally { setAssigningRoleId(null) }
  }

  async function toggleFunction(member: Member, funcId: string) {
    setAssigningFuncId(member.id)
    const currentIds = member.eagleVanguardFunctions.map(f => f.id)
    const newIds = currentIds.includes(funcId)
      ? currentIds.filter(id => id !== funcId)
      : [...currentIds, funcId]
    try {
      const res = await fetch(`/api/eagle-vanguard/members/${member.id}/functions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ functionIds: newIds }),
      })
      if (!res.ok) throw new Error()
      const newFunctions = functions.filter(f => newIds.includes(f.id))
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, eagleVanguardFunctions: newFunctions } : m))
    } catch { toast.error("Erreur lors de la mise à jour des fonctions") }
    finally { setAssigningFuncId(null) }
  }

  async function removeMember(memberId: string) {
    if (memberId === currentUserId) { toast.error("Vous ne pouvez pas vous retirer vous-même"); return }
    setRemovingId(memberId)
    try {
      const res = await fetch(`/api/eagle-vanguard/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEagleVanguardTeam: false }),
      })
      if (!res.ok) throw new Error()
      setMembers(prev => prev.filter(m => m.id !== memberId))
      toast.success("Membre retiré de la Eagle Vanguard Team")
    } catch { toast.error("Erreur lors du retrait") }
    finally { setRemovingId(null) }
  }

  async function promoteMember(user: SearchUser) {
    setPromotingId(user.id)
    try {
      const res = await fetch(`/api/eagle-vanguard/members/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEagleVanguardTeam: true }),
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
        eagleVanguardRankId: null,
        eagleVanguardRank: null,
        eagleVanguardFunctions: [],
      }
      setMembers(prev => [...prev, newMember])
      setSearchResults(prev => prev.filter(u => u.id !== user.id))
      setSearchQ("")
      const displayName = user.steamName ?? user.discordName ?? user.name ?? "Utilisateur"
      toast.success(`${displayName} ajouté à la Eagle Vanguard Team`)
    } catch { toast.error("Erreur lors de la promotion") }
    finally { setPromotingId(null) }
  }

  return (
    <div className="space-y-4">
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
          <div className="rounded-md border bg-background shadow-sm divide-y overflow-hidden">
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
                    size="sm" variant="ghost"
                    className="h-7 text-xs gap-1 shrink-0"
                    onClick={() => promoteMember(user)}
                    disabled={promotingId === user.id}
                  >
                    {promotingId === user.id
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <><UserPlus className="h-3 w-3" />Promouvoir</>}
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

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membre</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Fonctions</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-8">
                  Aucun membre Eagle Vanguard Team.
                </TableCell>
              </TableRow>
            )}
            {members.map(member => {
              const displayName = member.steamName ?? member.discordName ?? member.name ?? "Membre"
              const avatar = member.customAvatar ?? member.steamAvatar ?? member.discordAvatar
              const isSelf = member.id === currentUserId
              const isProtected = !!member.eagleVanguardRank?.isProtected
              const isHiddenRank = !!member.eagleVanguardRank?.isHidden
              const canEditSelf = isSelf && isSuperAdmin

              return (
                <TableRow key={member.id}>
                  {/* Membre */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={avatar ?? undefined} />
                        <AvatarFallback className="text-xs">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{displayName}</span>
                    </div>
                  </TableCell>

                  {/* Rôle */}
                  <TableCell>
                    {isHiddenRank && !canEditSelf ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : isProtected && !canEditSelf ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Protégé
                      </div>
                    ) : (
                      <Select
                        value={member.eagleVanguardRankId ?? "none"}
                        onValueChange={val => assignRole(member.id, val === "none" ? null : val)}
                        disabled={assigningRoleId === member.id}
                      >
                        <SelectTrigger className="w-36 h-7 text-xs">
                          {assigningRoleId === member.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <SelectValue placeholder="Aucun rôle" />}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun rôle</SelectItem>
                          {roles.filter(r => canEditSelf || !r.isProtected).map(r => (
                            <SelectItem key={r.id} value={r.id}>
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                                {r.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>

                  {/* Fonctions */}
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      {member.eagleVanguardFunctions.map(f => (
                        <Badge
                          key={f.id}
                          variant="outline"
                          className="flex items-center gap-1 px-1.5 py-0 text-xs font-normal h-5 cursor-pointer hover:bg-destructive/10"
                          style={{ borderColor: f.color, color: f.color }}
                          onClick={() => !assigningFuncId && toggleFunction(member, f.id)}
                        >
                          {f.name}
                          <X className="h-2 w-2" />
                        </Badge>
                      ))}
                      {functions.filter(f => !member.eagleVanguardFunctions.some(mf => mf.id === f.id)).length > 0 && (
                        <Select
                          value=""
                          onValueChange={val => toggleFunction(member, val)}
                          disabled={!!assigningFuncId}
                        >
                          <SelectTrigger className="h-5 w-auto px-1.5 text-xs border-dashed gap-1">
                            {assigningFuncId === member.id
                              ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              : <span>+</span>}
                          </SelectTrigger>
                          <SelectContent>
                            {functions
                              .filter(f => !member.eagleVanguardFunctions.some(mf => mf.id === f.id))
                              .map(f => (
                                <SelectItem key={f.id} value={f.id}>
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                                    {f.name}
                                  </span>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </TableCell>

                  {/* Retrait */}
                  <TableCell>
                    <Button
                      size="icon" variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeMember(member.id)}
                      disabled={removingId === member.id || isSelf || isProtected}
                      title={isSelf ? "Impossible de vous retirer vous-même" : isProtected ? "Membre protégé" : "Retirer"}
                    >
                      {removingId === member.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <UserMinus className="h-3.5 w-3.5" />}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

    </div>
  )
}
