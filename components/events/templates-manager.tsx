"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { toast } from "sonner"
import { Trash2, Plus, LayoutTemplate } from "lucide-react"

const EVENT_TYPES = ["Opération", "Entraînement", "Réunion", "Autre"]

const schema = z.object({
  name: z.string().min(2, "Minimum 2 caractères").max(60),
  title: z.string().min(3, "Minimum 3 caractères").max(100),
  type: z.string().min(1, "Sélectionnez un type"),
  maxSlots: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Template {
  id: string
  name: string
  title: string
  type: string
  description: string | null
  maxSlots: number | null
  createdAt: Date | string
}

interface Props {
  communitySlug: string
  initialTemplates: Template[]
}

export function TemplatesManager({ communitySlug, initialTemplates }: Props) {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState("")
  const [showForm, setShowForm] = useState(initialTemplates.length === 0)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/events/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          title: data.title,
          type: data.type,
          description: description || null,
          maxSlots: data.maxSlots ? parseInt(data.maxSlots, 10) : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error((json.error as string) ?? "Erreur")

      setTemplates((prev) => [json as Template, ...prev])
      reset()
      setDescription("")
      setShowForm(false)
      toast.success("Template créé !")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(
        `/api/communities/${communitySlug}/events/templates/${id}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error("Erreur lors de la suppression")
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      toast.success("Template supprimé")
      router.refresh()
    } catch {
      toast.error("Impossible de supprimer ce template")
    }
  }

  return (
    <div className="space-y-6">
      {/* Formulaire création */}
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nouveau template</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Nom du template</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Ex : Opération standard dimanche"
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                <p className="text-xs text-muted-foreground">
                  Nom interne pour retrouver ce template dans la liste.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="title">Titre de l&apos;événement</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Ex : Opération Overlord"
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select onValueChange={(v) => setValue("type", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="maxSlots">Places max (optionnel)</Label>
                  <Input
                    id="maxSlots"
                    type="number"
                    min={1}
                    {...register("maxSlots")}
                    placeholder="Illimité"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Description (optionnel)</Label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Briefing type, consignes standard..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Création..." : "Créer le template"}
                </Button>
                {templates.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setShowForm(false); reset(); setDescription("") }}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau template
        </Button>
      )}

      {/* Liste des templates */}
      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          <LayoutTemplate className="mx-auto h-8 w-8 mb-3 opacity-40" />
          <p className="text-sm">Aucun template pour le moment.</p>
          <p className="text-xs mt-1">
            Créez des templates pour pré-remplir rapidement vos événements.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="flex items-start justify-between rounded-lg border p-4 gap-4"
            >
              <div className="space-y-0.5 min-w-0">
                <p className="font-medium text-sm truncate">{tpl.name}</p>
                <p className="text-xs text-muted-foreground">
                  {tpl.title} · {tpl.type}
                  {tpl.maxSlots ? ` · ${tpl.maxSlots} places` : ""}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(tpl.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
