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
import { Card, CardContent } from "@/components/ui/card"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { toast } from "sonner"

const EVENT_TYPES = ["Opération", "Entraînement", "Réunion", "Autre"]

const ALL_STATUSES = ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"] as const

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ONGOING: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
}

const schema = z.object({
  title: z.string().min(3, "Minimum 3 caractères").max(100),
  type: z.string().min(1, "Sélectionnez un type"),
  status: z.enum(ALL_STATUSES),
  startDate: z.string().min(1, "Date de début requise"),
  startTime: z.string().min(1, "Heure de début requise"),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  maxSlots: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export interface EventData {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  startDate: string
  endDate: string | null
  maxSlots: number | null
}

export interface TemplateValues {
  title?: string
  type?: string
  description?: string | null
  maxSlots?: number | null
}

interface EventFormProps {
  communitySlug: string
  event?: EventData
  initialValues?: TemplateValues
}

function toDateInput(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function toTimeInput(iso: string): string {
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${h}:${min}`
}

export function EventForm({ communitySlug, event, initialValues }: EventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState(
    event?.description ?? initialValues?.description ?? ""
  )
  const isEdit = !!event

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? {
          title: event.title,
          type: event.type,
          status: event.status as typeof ALL_STATUSES[number],
          startDate: toDateInput(event.startDate),
          startTime: toTimeInput(event.startDate),
          endDate: event.endDate ? toDateInput(event.endDate) : "",
          endTime: event.endDate ? toTimeInput(event.endDate) : "",
          maxSlots: event.maxSlots != null ? String(event.maxSlots) : "",
        }
      : {
          status: "DRAFT",
          title: initialValues?.title ?? "",
          type: initialValues?.type ?? "",
          maxSlots: initialValues?.maxSlots != null ? String(initialValues.maxSlots) : "",
        },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const startDate = new Date(`${data.startDate}T${data.startTime}`)
      const endDate =
        data.endDate && data.endTime ? new Date(`${data.endDate}T${data.endTime}`) : undefined

      const payload = {
        title: data.title,
        description: description || null,
        type: data.type,
        status: data.status,
        startDate: startDate.toISOString(),
        endDate: endDate?.toISOString() ?? null,
        maxSlots: data.maxSlots ? parseInt(data.maxSlots, 10) : null,
      }

      const url = isEdit
        ? `/api/communities/${communitySlug}/events/${event.id}`
        : `/api/communities/${communitySlug}/events`

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error((json.error as string) ?? "Erreur")

      toast.success(isEdit ? "Événement mis à jour !" : "Événement créé !")
      const eventId = isEdit ? event.id : (json as { id: string }).id
      router.push(`/communities/${communitySlug}/events/${eventId}`)
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
              <Select defaultValue={event?.type} onValueChange={(v) => setValue("type", v)}>
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
                defaultValue={event?.status ?? "DRAFT"}
                onValueChange={(v) => setValue("status", v as typeof ALL_STATUSES[number])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(isEdit ? ALL_STATUSES : (["DRAFT", "PUBLISHED"] as const)).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
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
            <Label>Description (optionnel)</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Briefing de l'opération, objectifs, consignes..."
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading
                ? isEdit ? "Sauvegarde..." : "Création..."
                : isEdit ? "Sauvegarder les modifications" : "Créer l'événement"
              }
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
