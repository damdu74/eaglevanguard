"use client"

import { useState, useTransition } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sun, Moon, Monitor, Loader2, Check, Globe, Users, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

type Visibility = "PUBLIC" | "FRIENDS" | "PRIVATE"

interface SettingsFormProps {
  bio: string
  visibility: Visibility
  theme: string
}

export function SettingsForm({ bio: initialBio, visibility: initialVisibility, theme: initialTheme }: SettingsFormProps) {
  const [bio, setBio] = useState(initialBio)
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility)
  const [selectedTheme, setSelectedTheme] = useState(initialTheme)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { setTheme } = useTheme()

  function handleThemeChange(value: string) {
    setSelectedTheme(value)
    setTheme(value)
  }

  function save() {
    startTransition(async () => {
      await fetch("/api/profile/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, visibility, theme: selectedTheme }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const themes = [
    { value: "light", label: "Clair", icon: Sun },
    { value: "dark", label: "Sombre", icon: Moon },
    { value: "system", label: "Système", icon: Monitor },
  ]

  const visibilityOptions: { value: Visibility; label: string; description: string; icon: typeof Globe }[] = [
    { value: "PUBLIC", label: "Public", description: "Visible par tous", icon: Globe },
    { value: "FRIENDS", label: "Amis", description: "Visible par vos amis uniquement", icon: Users },
    { value: "PRIVATE", label: "Privé", description: "Visible uniquement par vous", icon: Lock },
  ]

  return (
    <div className="space-y-6">
      {/* Bio */}
      <Card>
        <CardHeader>
          <CardTitle>À propos</CardTitle>
          <CardDescription>Une courte description visible sur votre profil.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ex : Joueur ARMA 3 depuis 2015, spécialiste infanterie..."
            maxLength={300}
            rows={4}
          />
          <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
          <CardDescription>Choisissez le thème de l&apos;interface.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleThemeChange(value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted",
                  selectedTheme === value && "border-primary bg-primary/5"
                )}
              >
                <Icon className={cn("h-5 w-5", selectedTheme === value ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", selectedTheme === value ? "text-primary" : "text-muted-foreground")}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visibilité */}
      <Card>
        <CardHeader>
          <CardTitle>Confidentialité</CardTitle>
          <CardDescription>Choisissez qui peut voir votre profil.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {visibilityOptions.map(({ value, label, description, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setVisibility(value)}
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
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={save} disabled={isPending} className="min-w-32">
          {isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sauvegarde…</>
          ) : saved ? (
            <><Check className="h-4 w-4 mr-2" />Sauvegardé</>
          ) : (
            "Sauvegarder"
          )}
        </Button>
      </div>
    </div>
  )
}
