"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Pencil, X } from "lucide-react"

interface Props {
  initialBio: string | null
}

export function BioEdit({ initialBio }: Props) {
  const [bio, setBio] = useState(initialBio ?? "")
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)

  function startEdit() {
    setDraft(bio)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/profile/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: draft.trim() || null }),
      })
      if (!res.ok) throw new Error()
      setBio(draft.trim())
      setEditing(false)
      toast.success("Bio mise à jour")
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Décrivez-vous en quelques mots…"
          maxLength={300}
          rows={3}
          autoFocus
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{draft.length}/300</p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={cancel} disabled={saving}>
              <X className="h-3 w-3 mr-1" />
              Annuler
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Sauvegarder
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between gap-3 group">
      {bio ? (
        <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">Aucune bio renseignée.</p>
      )}
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={startEdit}
        title="Modifier la bio"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
