"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, Trash2, ChevronRight, Info, Copy, Check } from "lucide-react"
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
  transferForm?: React.ReactNode
}

export function CommunitySettingsForm({ community, isOwner, transferForm }: Props) {
  const router = useRouter()
  const [name, setName] = useState(community.name)
  const [slug, setSlug] = useState(community.slug)
  const [description, setDescription] = useState(community.description ?? "")
  const [isPublic, setIsPublic] = useState(community.isPublic)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState("")
  const [copied, setCopied] = useState(false)

  function copySlug() {
    navigator.clipboard.writeText(slug)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const autoSlug = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30)

  function handleNameChange(value: string) {
    setName(value)
    setSlug(autoSlug(value))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${community.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim(), description: description || null, isPublic }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "Erreur lors de la sauvegarde")
        return
      }
      toast.success("Paramètres sauvegardés")
      if (slug !== community.slug) {
        router.push(`/communities/${slug}/settings`)
      } else {
        router.refresh()
      }
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
            <Input id="name" value={name} onChange={(e) => handleNameChange(e.target.value)} maxLength={50} />
          </div>

          {isOwner && (
            <div className="space-y-1">
              <Label>Identifiant (URL)</Label>
              <div className="relative">
                <Input
                  value={slug}
                  readOnly
                  className="bg-muted text-muted-foreground cursor-default pr-9"
                />
                <button
                  type="button"
                  onClick={copySlug}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Copier l'identifiant"
                >
                  {copied
                    ? <Check className="h-4 w-4 text-green-500" />
                    : <Copy className="h-4 w-4" />
                  }
                </button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3 shrink-0" />
                Mis à jour automatiquement depuis le nom.
              </p>
            </div>
          )}

          <div className="space-y-1">
            <Label>Description</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Décrivez votre communauté..."
            />
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
          <CardDescription>Grades communautaires, candidatures et structure de la communauté.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 p-0">
          <Link
            href={`/communities/${community.slug}/settings/ranks`}
            className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-medium">Grades communautaires</span>
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

      {transferForm}

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
