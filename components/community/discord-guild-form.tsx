"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Link2, Link2Off, ExternalLink } from "lucide-react"

interface Props {
  slug: string
  currentGuildId: string | null
  discordClientId?: string | null
}

export function DiscordGuildForm({ slug, currentGuildId, discordClientId }: Props) {
  const [guildId, setGuildId] = useState(currentGuildId ?? "")
  const [saving, setSaving] = useState(false)
  const linked = !!currentGuildId

  async function save() {
    const trimmed = guildId.trim()
    if (!trimmed || !/^\d{17,20}$/.test(trimmed)) {
      toast.error("L'ID du serveur Discord doit être un nombre de 17 à 20 chiffres.")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordGuildId: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "Erreur lors de la sauvegarde")
        return
      }
      toast.success("Serveur Discord lié — les événements seront synchronisés toutes les heures.")
      window.location.reload()
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  async function unlink() {
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordGuildId: null }),
      })
      if (!res.ok) throw new Error()
      toast.success("Serveur Discord délié.")
      setGuildId("")
      window.location.reload()
    } catch {
      toast.error("Erreur lors de la suppression")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#5865F2]" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.013.043.031.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          Synchronisation Discord
        </CardTitle>
        <CardDescription>
          Liez votre serveur Discord pour importer automatiquement les événements programmés.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {linked ? (
          <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Serveur lié</p>
              <p className="text-xs text-muted-foreground font-mono">{currentGuildId}</p>
            </div>
            <Button variant="outline" size="sm" onClick={unlink} disabled={saving} className="gap-2 text-destructive hover:text-destructive">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2Off className="h-3.5 w-3.5" />}
              Délier
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="guildId">ID du serveur Discord</Label>
              <div className="flex gap-2">
                <Input
                  id="guildId"
                  value={guildId}
                  onChange={(e) => setGuildId(e.target.value)}
                  placeholder="123456789012345678"
                  className="font-mono"
                />
                <Button onClick={save} disabled={saving || !guildId.trim()} className="gap-2 shrink-0">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  Lier
                </Button>
              </div>
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground">Comment configurer :</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Ajoutez le bot Nexus à votre serveur Discord</li>
                <li>Dans Discord : Paramètres → Avancés → Mode développeur (activez-le)</li>
                <li>Clic droit sur votre serveur → <strong>Copier l&apos;identifiant du serveur</strong></li>
                <li>Collez l&apos;ID ci-dessus et cliquez Lier</li>
              </ol>
              {discordClientId && (
                <a
                  href={`https://discord.com/oauth2/authorize?client_id=${discordClientId}&permissions=0&scope=bot`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#5865F2] hover:underline font-medium mt-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Ajouter le bot Nexus à votre serveur
                </a>
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Les événements Discord programmés seront importés automatiquement toutes les heures.
          Ils sont en lecture seule sur Nexus.
        </p>
      </CardContent>
    </Card>
  )
}
