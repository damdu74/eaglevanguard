"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

const EVENT_TYPES = ["Opération", "Entraînement", "Réunion", "Autre"]

const schema = z.object({
  title: z.string().min(3, "Minimum 3 caractères").max(100),
  description: z.string().max(2000).optional(),
  type: z.string().min(1, "Sélectionnez un type"),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  startDate: z.string().min(1, "Date de début requise"),
  startTime: z.string().min(1, "Heure de début requise"),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  maxSlots: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface EventFormProps {
  communitySlug: string
}

export function EventForm({ communitySlug }: EventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "DRAFT" },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const startDate = new Date(`${data.startDate}T${data.startTime}`)
      const endDate =
        data.endDate && data.endTime ? new Date(`${data.endDate}T${data.endTime}`) : undefined

      const res = await fetch(`/api/communities/${communitySlug}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          type: data.type,
          status: data.status,
          startDate: startDate.toISOString(),
          endDate: endDate?.toISOString() ?? null,
          maxSlots: data.maxSlots ? parseInt(data.maxSlots, 10) : null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error((json.error as string) ?? "Erreur")

      toast.success("Événement créé !")
      router.push(`/communities/${communitySlug}/events/${(json as { id: string }).id}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1">
            <Label htmlFor="title">Titre de l&apos;événement</Label>
            <Input id="title" {...register("title")} placeholder="Opération Overlord" />
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
              <Label>Statut</Label>
              <Select
                defaultValue="DRAFT"
                onValueChange={(v) => setValue("status", v as "DRAFT" | "PUBLISHED")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Brouillon</SelectItem>
                  <SelectItem value="PUBLISHED">Publier maintenant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="startDate">Date de début</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="startTime">Heure</Label>
              <Input id="startTime" type="time" {...register("startTime")} />
              {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="endDate">Date de fin (optionnel)</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endTime">Heure de fin</Label>
              <Input id="endTime" type="time" {...register("endTime")} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="maxSlots">Places maximales (optionnel)</Label>
            <Input
              id="maxSlots"
              type="number"
              min={1}
              {...register("maxSlots")}
              placeholder="Illimité"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Briefing de l'opération, objectifs, consignes..."
              rows={4}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer l'événement"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
