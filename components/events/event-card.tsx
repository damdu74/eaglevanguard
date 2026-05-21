import Link from "next/link"
import { Calendar, Clock, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "Brouillon", variant: "outline" },
  PUBLISHED: { label: "Publié", variant: "secondary" },
  ONGOING: { label: "En cours", variant: "default" },
  COMPLETED: { label: "Terminé", variant: "outline" },
  CANCELLED: { label: "Annulé", variant: "destructive" },
}

const PARTICIPATION_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmé",
  TENTATIVE: "Peut-être",
  DECLINED: "Décliné",
}

interface EventCardProps {
  event: {
    id: string
    title: string
    type: string
    status: string
    startDate: string | Date
    endDate?: string | Date | null
    maxSlots?: number | null
    _count: { participants: number }
    myStatus?: string | null
  }
  slug: string
}

export function EventCard({ event, slug }: EventCardProps) {
  const startDate = new Date(event.startDate)
  const endDate = event.endDate ? new Date(event.endDate) : null
  const statusInfo = STATUS_LABELS[event.status] ?? { label: event.status, variant: "outline" as const }

  return (
    <Link href={`/communities/${slug}/events/${event.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="py-4 flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold truncate">{event.title}</p>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              <Badge variant="outline" className="text-xs">{event.type}</Badge>
              {event.myStatus && (
                <Badge variant="secondary" className="text-xs">
                  {PARTICIPATION_LABELS[event.myStatus] ?? event.myStatus}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {startDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                {endDate && (
                  <> – {endDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</>
                )}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {event._count.participants}
                {event.maxSlots != null && ` / ${event.maxSlots}`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
