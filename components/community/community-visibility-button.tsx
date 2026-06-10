"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Globe, Users, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

type Visibility = "PUBLIC" | "WHITELIST" | "INVISIBLE"

const options: { value: Visibility; label: string; description: string; icon: typeof Globe; bg: string }[] = [
  { value: "PUBLIC",    label: "Ouverte",          description: "Rejoindre sans candidature",       icon: Globe,   bg: "bg-green-600 hover:bg-green-700 border-green-600 text-white" },
  { value: "WHITELIST", label: "Sur candidature",   description: "Candidature requise",              icon: Users,   bg: "bg-blue-600 hover:bg-blue-700 border-blue-600 text-white" },
  { value: "INVISIBLE", label: "Invisible",         description: "Non visible dans l'annuaire",      icon: EyeOff,  bg: "bg-neutral-800 hover:bg-neutral-900 border-neutral-800 text-white dark:bg-neutral-700 dark:border-neutral-600" },
]

interface Props {
  slug: string
  initialVisibility: Visibility
}

export function CommunityVisibilityButton({ slug, initialVisibility }: Props) {
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility)
  const [saving, setSaving] = useState(false)

  const current = options.find((o) => o.value === visibility)!
  const Icon = current.icon

  async function handleChange(value: Visibility) {
    if (value === visibility || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: value }),
      })
      if (!res.ok) throw new Error()
      setVisibility(value)
      toast.success("Visibilité mise à jour")
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
          <Icon className="h-4 w-4" />
          <span className="text-sm">{current.label}</span>
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
