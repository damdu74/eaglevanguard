import Link from "next/link"
import { Calendar, Clock, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LocalDate, LocalTime } from "@/components/ui/local-date-time"
import { EventCardStatusDropdown } from "@/components/events/event-card-status-dropdown"
import { computeDisplayStatus } from "@/lib/event-status"

const PARTICIPATION_STYLES: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: "Présent",     className: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20" },
  TENTATIVE: { label: "Incertain",   className: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20" },
  DECLINED:  { label: "Non présent", className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20" },
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
              {event.myStatus && PARTICIPATION_STYLES[event.myStatus] && (
                <Badge variant="outline" className={`text-xs ${PARTICIPATION_STYLES[event.myStatus].className}`}>
                  {PARTICIPATION_STYLES[event.myStatus].label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <Badge variant={displayStatus.variant} className={`text-xs ${displayStatus.className}`}>{displayStatus.label}</Badge>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <LocalDate iso={startIso} options={{ day: "numeric", month: "short", year: "numeric" }} />
              </span>
              <Badge variant="outline" className="text-xs">{event.type}</Badge>
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

        {isStaff && ["DRAFT", "PUBLISHED", "CANCELLED"].includes(event.status) && (
          <EventCardStatusDropdown
            communitySlug={slug}
            eventId={event.id}
            currentStatus={event.status as "DRAFT" | "PUBLISHED" | "CANCELLED"}
          />
        )}
      </CardContent>
    </Card>
  )
}
