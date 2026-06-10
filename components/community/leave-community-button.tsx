"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LogOut, Loader2 } from "lucide-react"

interface Props {
  slug: string
  communityName: string
}

export function LeaveCommunityButton({ slug, communityName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLeave() {
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/${slug}/leave`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "Erreur lors de la désinscription")
        return
      }
      toast.success(`Vous avez quitté ${communityName}`)
      setOpen(false)
      router.push("/communities/mine")
    } catch {
      toast.error("Erreur lors de la désinscription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive gap-2">
          <LogOut className="h-4 w-4" />
          Quitter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quitter {communityName} ?</DialogTitle>
          <DialogDescription>
            Vous perdrez l'accès aux contenus réservés aux membres. Vous pourrez soumettre une nouvelle candidature pour rejoindre à nouveau.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleLeave} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Désinscription…</> : "Quitter la communauté"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
