"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  steamName?: string | null
}

export function CandidatureForm({ steamName }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/candidature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Une erreur est survenue")
        return
      }
      router.refresh()
    } catch {
      setError("Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {steamName && (
        <div className="space-y-1.5">
          <Label htmlFor="steamName">Pseudo Steam</Label>
          <Input id="steamName" value={steamName} readOnly className="bg-muted text-muted-foreground cursor-default" />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="message">Message de motivation <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Présentez-vous, votre expérience, vos motivations…"
          rows={5}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Envoi en cours…" : "Envoyer ma candidature"}
      </Button>
    </form>
  )
}
