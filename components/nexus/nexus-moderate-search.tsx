"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Search, AlertTriangle, Ban, RotateCcw, MoreHorizontal, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type ModActionType = "WARN" | "BAN_PLATFORM" | "UNBAN"

const MOD_LABELS: Record<ModActionType, string> = {
  WARN: "Avertir",
  BAN_PLATFORM: "Bannir de la plateforme",
  UNBAN: "Lever le ban",
}

const MOD_ICONS: Record<ModActionType, React.ReactNode> = {
  WARN: <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />,
  BAN_PLATFORM: <Ban className="mr-2 h-4 w-4 text-red-600" />,
  UNBAN: <RotateCcw className="mr-2 h-4 w-4 text-green-500" />,
}

interface UserResult {
  id: string
  steamName: string | null
  discordName: string | null
  name: string | null
  customAvatar: string | null
  steamAvatar: string | null
  discordAvatar: string | null
  image: string | null
}

function getDisplayName(u: UserResult) {
  return u.steamName ?? u.discordName ?? u.name ?? "Utilisateur"
}

function getAvatar(u: UserResult) {
  return u.customAvatar ?? u.steamAvatar ?? u.discordAvatar ?? u.image ?? undefined
}

export function NexusModerateSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const [targetUser, setTargetUser] = useState<UserResult | null>(null)
  const [modAction, setModAction] = useState<ModActionType | null>(null)
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.trim().length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}&forMod=true`)
        const data = await res.json()
        setResults(Array.isArray(data) ? data : [])
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  function openDialog(user: UserResult, action: ModActionType) {
    setTargetUser(user)
    setModAction(action)
    setReason("")
    setNote("")
  }

  async function submitModAction() {
    if (!targetUser || !modAction || !reason.trim()) return
    setSubmitting(true)
    try {
      const body: Record<string, string> = {
        type: modAction,
        targetId: targetUser.id,
        reason: reason.trim(),
      }
      if (note.trim()) body.note = note.trim()

      const res = await fetch("/api/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Erreur")
      }
      toast.success(`${MOD_LABELS[modAction]} appliqué sur ${getDisplayName(targetUser)}`)
      setModAction(null)
      setTargetUser(null)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'action")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="pl-8 h-8 text-sm"
          />
          {searching && <Loader2 className="absolute right-2.5 top-2 h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {results.length > 0 && (
          <div className="rounded-md border bg-background shadow-sm divide-y overflow-hidden">
            {results.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={getAvatar(user)} />
                    <AvatarFallback className="text-xs">{getDisplayName(user)[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm truncate">{getDisplayName(user)}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-xs">{getDisplayName(user)}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(["WARN", "BAN_PLATFORM", "UNBAN"] as ModActionType[]).map((type) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => openDialog(user, type)}
                        className={type === "BAN_PLATFORM" ? "text-destructive focus:text-destructive" : ""}
                      >
                        {MOD_ICONS[type]}
                        {MOD_LABELS[type]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}

        {query.trim().length >= 2 && !searching && results.length === 0 && (
          <p className="text-xs text-muted-foreground">Aucun utilisateur trouvé.</p>
        )}
      </div>

      <Dialog open={!!modAction} onOpenChange={(o) => !o && setModAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modAction && MOD_ICONS[modAction]}
              {modAction && MOD_LABELS[modAction]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {targetUser && (
              <p className="text-sm text-muted-foreground">
                Action sur <span className="font-medium text-foreground">{getDisplayName(targetUser)}</span>
              </p>
            )}
            <div>
              <Label>Raison <span className="text-destructive">*</span></Label>
              <Textarea
                className="mt-1 resize-none"
                rows={3}
                placeholder="Motif de la sanction..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                autoFocus
              />
            </div>
            <div>
              <Label>Note interne <span className="text-muted-foreground text-xs">(optionnelle)</span></Label>
              <Textarea
                className="mt-1 resize-none"
                rows={2}
                placeholder="Visible uniquement par le staff..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModAction(null)}>Annuler</Button>
            <Button
              onClick={submitModAction}
              disabled={submitting || !reason.trim()}
              variant={modAction === "BAN_PLATFORM" ? "destructive" : "default"}
            >
              {submitting ? "Envoi..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
