"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface Props {
  communitySlug: string
  mode: "apply" | "withdraw"
}

export function ApplyForm({ communitySlug, mode }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function apply() {
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() || null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Erreur")
      }
      toast.success("Candidature envoyée !")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  async function withdraw() {
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/apply`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Candidature retirée")
      router.refresh()
    } catch {
      toast.error("Erreur lors du retrait")
    } finally {
      setLoading(false)
    }
  }

  if (mode === "withdraw") {
    return (
      <div className="flex justify-end pt-2">
        <Button variant="outline" onClick={withdraw} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Retirer ma candidature
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="message">Message de motivation (optionnel)</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Présentez-vous et expliquez pourquoi vous souhaitez rejoindre cette communauté…"
          maxLength={1000}
          rows={5}
        />
        <p className="text-xs text-muted-foreground text-right">{message.length}/1000</p>
      </div>
      <div className="flex justify-end">
        <Button onClick={apply} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Envoyer la candidature
        </Button>
      </div>
    </div>
  )
}
