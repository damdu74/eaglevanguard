"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Sun, Moon, Monitor, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingsFormProps {
  theme: string
  genre: string | null
}

export function SettingsForm({ theme: initialTheme, genre: initialGenre }: SettingsFormProps) {
  const [selectedTheme, setSelectedTheme] = useState(initialTheme)
  const [genre, setGenre] = useState(initialGenre ?? "")
  const [saved, setSaved] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const { setTheme } = useTheme()

  function handleThemeChange(value: string) {
    setSelectedTheme(value)
    setTheme(value)
  }

  async function save() {
    setIsPending(true)
    await fetch("/api/profile/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: selectedTheme, genre: genre || null }),
    })
    setIsPending(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const themes = [
    { value: "light", label: "Clair", icon: Sun },
    { value: "dark", label: "Sombre", icon: Moon },
    { value: "system", label: "Système", icon: Monitor },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Informations personnelles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

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
