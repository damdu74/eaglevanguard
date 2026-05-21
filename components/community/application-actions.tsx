"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Props {
  applicationId: string
  communitySlug: string
}

export function ApplicationActions({ applicationId, communitySlug }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  async function accept() {
    setLoading("accept")
    try {
      const res = await fetch(`/api/communities/${communitySlug}/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Erreur")
      }
      toast.success("Candidature acceptée")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(null)
    }
  }

  async function confirmReject() {
    setLoading("reject")
    try {
      const res = await fetch(`/api/communities/${communitySlug}/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", response: rejectReason.trim() || null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Erreur")
      }
      toast.success("Candidature refusée")
      setRejectOpen(false)
      setRejectReason("")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" onClick={accept} disabled={loading !== null}>
          {loading === "accept" && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          Accepter
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRejectOpen(true)}
          disabled={loading !== null}
        >
          Refuser
        </Button>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la candidature</DialogTitle>
            <DialogDescription>
              Vous pouvez indiquer une raison au candidat. Ce message lui sera communiqué.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Raison du refus (optionnel)…"
            maxLength={500}
            rows={4}
          />
          <p className="text-xs text-muted-foreground text-right">{rejectReason.length}/500</p>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)} disabled={loading === "reject"}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmReject} disabled={loading === "reject"}>
              {loading === "reject" && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
