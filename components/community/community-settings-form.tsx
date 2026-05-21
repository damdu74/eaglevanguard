"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, Trash2, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Props {
  community: {
    name: string
    slug: string
    description: string | null
    isPublic: boolean
    game: string
  }
  isOwner: boolean
}

export function CommunitySettingsForm({ community, isOwner }: Props) {
  const router = useRouter()
  const [name, setName] = useState(community.name)
  const [description, setDescription] = useState(community.description ?? "")
  const [isPublic, setIsPublic] = useState(community.isPublic)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState("")

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${community.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null, isPublic }),
      })
      if (!res.ok) throw new Error()
      toast.success("Paramètres sauvegardés")
      router.refresh()
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  async function deleteCommunity() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/communities/${community.slug}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Communauté supprimée")
      router.push("/communities")
    } catch {
      toast.error("Erreur lors de la suppression")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>Modifiez le nom et la description de votre communauté.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre communauté..."
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Communauté publique</p>
              <p className="text-xs text-muted-foreground">
                Visible par tous les joueurs dans la liste des communautés.
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving || !name.trim()}>
              {saving
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sauvegarde…</>
                : "Sauvegarder"
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gestion avancée</CardTitle>
          <CardDescription>Grades, candidatures et structure de la communauté.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 p-0">
          <Link
            href={`/communities/${community.slug}/settings/ranks`}
            className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-medium">Gérer les grades</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Separator />
          <Link
            href={`/communities/${community.slug}/applications`}
            className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-medium">Candidatures</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      {isOwner && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Zone dangereuse</CardTitle>
            <CardDescription>La suppression est définitive et irréversible.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="confirm">
                Tapez{" "}
                <span className="font-mono font-semibold">{community.name}</span>{" "}
                pour confirmer la suppression
              </Label>
              <Input
                id="confirm"
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
                placeholder={community.name}
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="destructive"
                onClick={deleteCommunity}
                disabled={deleting || confirmDelete !== community.name}
              >
                {deleting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Suppression…</>
                  : <><Trash2 className="mr-2 h-4 w-4" />Supprimer la communauté</>
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
