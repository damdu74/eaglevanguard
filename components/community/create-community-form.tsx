"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { toast } from "sonner"

const schema = z.object({
  name: z.string().min(3, "Minimum 3 caractères").max(50),
  slug: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9-]+$/, "Uniquement lettres minuscules, chiffres et tirets"),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function CreateCommunityForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, description: description || undefined, game: "ArmA 3", language: "fr" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error((json.error as string) ?? "Erreur")
      toast.success("Communauté créée !")
      router.push(`/communities/${json.slug as string}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Nom de la communauté</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="1ère Compagnie de Marines"
              onChange={(e) => {
                register("name").onChange(e)
                setValue("slug", autoSlug(e.target.value))
              }}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="slug">Identifiant URL</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">eaglevanguard.gg/</span>
              <Input id="slug" {...register("slug")} placeholder="1ere-compagnie" />
            </div>
            {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Description (optionnel)</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Décrivez votre communauté..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Création..." : "Créer la communauté"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
