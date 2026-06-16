"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Props {
  steamName?: string | null
}

function calcAge(dob: string): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age > 0 && age < 120 ? age : null
}

export function CandidatureForm({ steamName }: Props) {
  const router = useRouter()
  const [dob, setDob] = useState("")
  const [genre, setGenre] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const age = calcAge(dob)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/candidature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, age, genre: genre || null }),
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
        <Label htmlFor="dob">Date de naissance</Label>
        <div className="flex items-center gap-3">
          <Input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="w-44"
          />
          {age !== null && (
            <span className="text-sm text-muted-foreground">{age} ans</span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="genre">Genre</Label>
        <Select value={genre} onValueChange={setGenre}>
          <SelectTrigger id="genre" className="w-44">
            <SelectValue placeholder="Sélectionner…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Homme">Homme</SelectItem>
            <SelectItem value="Femme">Femme</SelectItem>
            <SelectItem value="Autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
