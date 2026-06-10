"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { LogOut, Loader2 } from "lucide-react"

interface Props {
  slug: string
  communityName: string
}

export function LeaveCommunityButton({ slug, communityName }: Props) {
  const router = useRouter()
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
      router.push("/communities/mine")
    } catch {
      toast.error("Erreur lors de la désinscription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive gap-2">
          <LogOut className="h-4 w-4" />
          Quitter
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Quitter {communityName} ?</AlertDialogTitle>
          <AlertDialogDescription>
            Vous perdrez l'accès aux contenus réservés aux membres. Vous pourrez soumettre une nouvelle candidature pour rejoindre à nouveau.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLeave}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Désinscription…</> : "Quitter la communauté"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
