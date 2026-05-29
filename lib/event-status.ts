export type DisplayStatus = "À venir" | "En cours" | "Terminé" | "Brouillon" | "Annulé"

export interface DisplayStatusInfo {
  label: DisplayStatus
  variant: "default" | "secondary" | "outline" | "destructive"
  className: string
}

const STATUS_MAP: Record<DisplayStatus, DisplayStatusInfo> = {
  "À venir":  { label: "À venir",  variant: "outline", className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  "En cours": { label: "En cours", variant: "outline", className: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20" },
  "Terminé":  { label: "Terminé",  variant: "outline", className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20" },
  "Brouillon":{ label: "Brouillon",variant: "outline", className: "" },
  "Annulé":   { label: "Annulé",   variant: "outline", className: "bg-muted text-muted-foreground" },
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
