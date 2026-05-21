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

const options: { value: Visibility; label: string; description: string; icon: typeof Globe; bg: string; iconColor: string }[] = [
  { value: "PUBLIC", label: "Public", description: "Visible par tous", icon: Globe, bg: "bg-blue-500 hover:bg-blue-600 border-blue-500 text-white", iconColor: "text-white" },
  { value: "FRIENDS", label: "Amis", description: "Amis uniquement", icon: Users, bg: "bg-violet-500 hover:bg-violet-600 border-violet-500 text-white", iconColor: "text-white" },
  { value: "PRIVATE", label: "Privé", description: "Vous seul", icon: Lock, bg: "bg-black hover:bg-neutral-800 border-black text-white dark:bg-neutral-800 dark:border-neutral-700", iconColor: "text-white" },
]

export function VisibilityIcon({ initialVisibility }: { initialVisibility: Visibility }) {
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility)
  const [saving, setSaving] = useState(false)

  const current = options.find((o) => o.value === visibility)!
  const Icon = current.icon

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
        <Button variant="outline" size="sm" className={cn("gap-2", current.bg)} disabled={saving}>
          <Icon className="h-4 w-4 text-white" />
          <span className="text-sm text-white">{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map(({ value, label, description, icon: Ico }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => handleChange(value)}
            className={cn("gap-3 cursor-pointer", value === visibility && "font-medium")}
          >
            <Ico className="h-4 w-4 shrink-0" />
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
