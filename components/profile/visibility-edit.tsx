"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Globe, Users, Lock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Visibility = "PUBLIC" | "FRIENDS" | "PRIVATE"

interface Props {
  initialVisibility: Visibility
}

const options: { value: Visibility; label: string; description: string; icon: typeof Globe }[] = [
  { value: "PUBLIC", label: "Public", description: "Visible par tous", icon: Globe },
  { value: "FRIENDS", label: "Amis", description: "Amis uniquement", icon: Users },
  { value: "PRIVATE", label: "Privé", description: "Vous seul", icon: Lock },
]

export function VisibilityEdit({ initialVisibility }: Props) {
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility)
  const [saving, setSaving] = useState(false)

  async function handleChange(value: Visibility) {
    if (value === visibility || saving) return
    setSaving(true)
    try {
      const res = await fetch("/api/profile/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: value }),
      })
      if (!res.ok) throw new Error()
      setVisibility(value)
      toast.success("Confidentialité mise à jour")
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3 relative">
      {saving && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg z-10">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {options.map(({ value, label, description, icon: Icon }) => (
        <button
          key={value}
          onClick={() => handleChange(value)}
          disabled={saving}
          className={cn(
            "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors hover:bg-muted",
            visibility === value && "border-primary bg-primary/5"
          )}
        >
          <Icon className={cn("h-5 w-5", visibility === value ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-sm font-medium", visibility === value ? "text-primary" : "text-muted-foreground")}>
            {label}
          </span>
          <span className="text-xs text-muted-foreground leading-tight">{description}</span>
        </button>
      ))}
    </div>
  )
}
