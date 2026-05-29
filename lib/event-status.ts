export type DisplayStatus = "À venir" | "En cours" | "Terminé" | "Brouillon" | "Annulé"

export interface DisplayStatusInfo {
  label: DisplayStatus
  variant: "default" | "secondary" | "outline" | "destructive"
  color: string
}

const STATUS_MAP: Record<DisplayStatus, DisplayStatusInfo> = {
  "À venir":  { label: "À venir",  variant: "secondary",    color: "text-blue-600 dark:text-blue-400" },
  "En cours": { label: "En cours", variant: "default",      color: "text-green-600 dark:text-green-500" },
  "Terminé":  { label: "Terminé",  variant: "outline",      color: "text-muted-foreground" },
  "Brouillon":{ label: "Brouillon",variant: "outline",      color: "text-muted-foreground" },
  "Annulé":   { label: "Annulé",   variant: "destructive",  color: "text-destructive" },
}

export function computeDisplayStatus(
  status: string,
  startDate: Date | string,
  endDate: Date | string | null
): DisplayStatusInfo {
  if (status === "DRAFT") return STATUS_MAP["Brouillon"]
  if (status === "CANCELLED") return STATUS_MAP["Annulé"]

  const now = new Date()
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : null

  if (start > now) return STATUS_MAP["À venir"]
  if (!end || end > now) return STATUS_MAP["En cours"]
  return STATUS_MAP["Terminé"]
}
