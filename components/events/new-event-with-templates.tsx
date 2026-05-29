"use client"

import { useState } from "react"
import { EventForm, type TemplateValues } from "@/components/events/event-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { LayoutTemplate } from "lucide-react"

interface Template {
  id: string
  name: string
  title: string
  type: string
  description: string | null
  maxSlots: number | null
}

interface Props {
  communitySlug: string
  templates: Template[]
}

export function NewEventWithTemplates({ communitySlug, templates }: Props) {
  const [selectedKey, setSelectedKey] = useState<string>("blank")
  const [initialValues, setInitialValues] = useState<TemplateValues | undefined>(undefined)

  function handleTemplateChange(value: string) {
    setSelectedKey(value)
    if (value === "blank") {
      setInitialValues(undefined)
      return
    }
    const tpl = templates.find((t) => t.id === value)
    if (tpl) {
      setInitialValues({
        title: tpl.title,
        type: tpl.type,
        description: tpl.description,
        maxSlots: tpl.maxSlots,
      })
    }
  }

  return (
    <div className="space-y-6">
      {templates.length > 0 && (
        <div className="rounded-lg border bg-muted/30 px-4 py-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
            <Label>Charger un template</Label>
          </div>
          <Select value={selectedKey} onValueChange={handleTemplateChange}>
            <SelectTrigger className="max-w-xs bg-background">
              <SelectValue placeholder="Formulaire vide" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blank">Formulaire vide</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedKey !== "blank" && (
            <p className="text-xs text-muted-foreground">
              Le formulaire a été pré-rempli avec ce template. Les dates restent à définir.
            </p>
          )}
        </div>
      )}

      <EventForm
        key={selectedKey}
        communitySlug={communitySlug}
        initialValues={initialValues}
      />
    </div>
  )
}
