"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface Props {
  slug: string
}

export function JoinButton({ slug }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/${slug}/join`, { method: "POST" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "Erreur lors de l'adhésion")
        return
      }
      toast.success("Vous avez rejoint la communauté !")
      router.refresh()
    } catch {
      toast.error("Erreur lors de l'adhésion")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleJoin} disabled={loading}>
      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adhésion…</> : "Rejoindre"}
    </Button>
  )
}
