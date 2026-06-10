"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import { MoreHorizontal, Star, UserMinus, AlertTriangle, Ban, RotateCcw } from "lucide-react"

type ModActionType = "WARN" | "KICK" | "BAN_COMMUNITY" | "BAN_PLATFORM" | "UNBAN"

const MOD_LABELS: Record<ModActionType, string> = {
  WARN: "Avertir",
  KICK: "Expulser (avec raison)",
  BAN_COMMUNITY: "Bannir de la communauté",
  BAN_PLATFORM: "Bannir de la plateforme",
  UNBAN: "Lever le ban",
}

const MOD_ICONS: Record<ModActionType, React.ReactNode> = {
  WARN: <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />,
  KICK: <UserMinus className="mr-2 h-4 w-4 text-orange-500" />,
  BAN_COMMUNITY: <Ban className="mr-2 h-4 w-4 text-red-500" />,
  BAN_PLATFORM: <Ban className="mr-2 h-4 w-4 text-red-700" />,
  UNBAN: <RotateCcw className="mr-2 h-4 w-4 text-green-500" />,
}

interface Props {
  communitySlug: string
  userId: string
  userName: string
  currentRankId: string | null
  ranks: { id: string; name: string; isPermanent: boolean }[]
  canModerate?: boolean
  isEagleVanguardTeam?: boolean
}

export function MemberActions({
  communitySlug,
  userId,
  userName,
  currentRankId,
  ranks,
  canModerate = false,
  isEagleVanguardTeam = false,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [modAction, setModAction] = useState<ModActionType | null>(null)
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function patch(body: object) {
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Erreur")
      }
      toast.success("Membre mis à jour")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  async function kick() {
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/members/${userId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Erreur")
      }
      toast.success("Membre exclu")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  async function submitModAction() {
    if (!modAction || !reason.trim()) return
    setSubmitting(true)
    try {
      const apiUrl = isEagleVanguardTeam && (modAction === "BAN_PLATFORM" || modAction === "UNBAN")
        ? "/api/moderation"
        : `/api/communities/${communitySlug}/moderation`

      const body: Record<string, string> = {
        type: modAction,
        targetId: userId,
        reason: reason.trim(),
      }
      if (note.trim()) body.note = note.trim()

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Erreur")
      }
      toast.success(`Action appliquée : ${MOD_LABELS[modAction]}`)
      setModAction(null)
      setReason("")
      setNote("")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'action")
    } finally {
      setSubmitting(false)
    }
  }

  const availableRanks = ranks.filter((r) => !r.isPermanent)

  const communityModActions: ModActionType[] = ["WARN", "KICK", "BAN_COMMUNITY", "UNBAN"]
  const eagleVanguardModActions: ModActionType[] = ["BAN_PLATFORM", "UNBAN"]

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>{userName}</DropdownMenuLabel>

          {availableRanks.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Star className="mr-2 h-4 w-4" />
                Attribuer un grade
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  disabled={currentRankId === null}
                  onClick={() => patch({ rankId: null })}
                >
                  Aucun grade{currentRankId === null && " ✓"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {availableRanks.map((rank) => (
                  <DropdownMenuItem
                    key={rank.id}
                    disabled={rank.id === currentRankId}
                    onClick={() => patch({ rankId: rank.id })}
                  >
                    {rank.name}{rank.id === currentRankId && " ✓"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          {canModerate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal py-1">Modération</DropdownMenuLabel>
              {communityModActions.map((type) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => { setModAction(type); setReason(""); setNote("") }}
                  className={type === "BAN_COMMUNITY" ? "text-destructive focus:text-destructive" : ""}
                >
                  {MOD_ICONS[type]}
                  {MOD_LABELS[type]}
                </DropdownMenuItem>
              ))}
            </>
          )}

          {isEagleVanguardTeam && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal py-1">Eagle Vanguard</DropdownMenuLabel>
              {eagleVanguardModActions.map((type) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => { setModAction(type); setReason(""); setNote("") }}
                  className={type === "BAN_PLATFORM" ? "text-destructive focus:text-destructive" : ""}
                >
                  {MOD_ICONS[type]}
                  {MOD_LABELS[type]}
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-muted-foreground focus:text-foreground"
            onClick={kick}
          >
            <UserMinus className="mr-2 h-4 w-4" />
            Exclure (sans log)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog modération */}
      <Dialog open={!!modAction} onOpenChange={(o) => !o && setModAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modAction && MOD_ICONS[modAction]}
              {modAction && MOD_LABELS[modAction]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Action sur <span className="font-medium text-foreground">{userName}</span>
            </p>
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
              variant={modAction === "BAN_COMMUNITY" || modAction === "BAN_PLATFORM" ? "destructive" : "default"}
            >
              {submitting ? "Envoi..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
