"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface Props {
  applicationId: string
  communitySlug: string
}

export function ApplicationActions({ applicationId, communitySlug }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null)

  async function act(action: "accept" | "reject") {
    setLoading(action)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Erreur")
      }
      toast.success(action === "accept" ? "Candidature acceptée" : "Candidature refusée")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => act("accept")}
        disabled={loading !== null}
      >
        {loading === "accept" && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        Accepter
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => act("reject")}
        disabled={loading !== null}
      >
        {loading === "reject" && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        Refuser
      </Button>
    </div>
  )
}
