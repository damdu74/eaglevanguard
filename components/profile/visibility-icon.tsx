"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Globe, Users, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

type Visibility = "PUBLIC" | "FRIENDS" | "PRIVATE"

const options: { value: Visibility; label: string; description: string; icon: typeof Globe; color: string }[] = [
  { value: "PUBLIC", label: "Public", description: "Visible par tous", icon: Globe, color: "text-blue-500" },
  { value: "FRIENDS", label: "Amis", description: "Amis uniquement", icon: Users, color: "text-violet-500" },
  { value: "PRIVATE", label: "Privé", description: "Vous seul", icon: Lock, color: "text-foreground" },
]

export function VisibilityIcon({ initialVisibility }: { initialVisibility: Visibility }) {
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility)
  const [saving, setSaving] = useState(false)

  const current = options.find((o) => o.value === visibility)!
  const Icon = current.icon
  const color = current.color

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={saving}>
          <Icon className={cn("h-4 w-4", color)} />
          <span className={cn("text-sm", color)}>{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map(({ value, label, description, icon: Ico }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => handleChange(value)}
            className={cn("gap-3 cursor-pointer", value === visibility && "font-medium")}
          >
            <Ico className={cn("h-4 w-4 shrink-0", color)} />
            <div>
              <p>{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
