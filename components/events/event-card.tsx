import Link from "next/link"
import { Calendar, Clock, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LocalDate, LocalTime } from "@/components/ui/local-date-time"
import { EventCardStatusDropdown } from "@/components/events/event-card-status-dropdown"
import { computeDisplayStatus } from "@/lib/event-status"

const PARTICIPATION_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmé",
  TENTATIVE: "Peut-être",
  DECLINED:  "Décliné",
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
  isStaff?: boolean
}

export function EventCard({ event, slug, isStaff }: EventCardProps) {
  const startIso = typeof event.startDate === "string" ? event.startDate : event.startDate.toISOString()
  const endIso = event.endDate
    ? typeof event.endDate === "string" ? event.endDate : event.endDate.toISOString()
    : null

  const displayStatus = computeDisplayStatus(event.status, event.startDate, event.endDate ?? null)

  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent className="py-4 flex items-center gap-4">
        <Link href={`/communities/${slug}/events/${event.id}`} className="flex-1 min-w-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold truncate">{event.title}</p>
              <Badge variant={displayStatus.variant}>{displayStatus.label}</Badge>
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
                <LocalDate iso={startIso} options={{ day: "numeric", month: "short", year: "numeric" }} />
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <LocalTime iso={startIso} />
                {endIso && <> – <LocalTime iso={endIso} /></>}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {event._count.participants}
                {event.maxSlots != null && ` / ${event.maxSlots}`}
              </span>
            </div>
          </div>
        </Link>

        {isStaff && (event.status === "DRAFT" || event.status === "PUBLISHED") && (
          <EventCardStatusDropdown
            communitySlug={slug}
            eventId={event.id}
            currentStatus={event.status as "DRAFT" | "PUBLISHED"}
          />
        )}
      </CardContent>
    </Card>
  )
}
