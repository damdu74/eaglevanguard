import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/events/event-card"
import { EventCalendar } from "@/components/events/event-calendar"
import Link from "next/link"
import { Plus, ChevronLeft, List, CalendarDays } from "lucide-react"

interface PageProps {
  params: { slug: string }
  searchParams?: { view?: string }
}

export async function generateMetadata({ params }: PageProps) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  return { title: community ? `Événements — ${community.name}` : "Événements" }
}

export default async function CommunityEventsPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  const view = searchParams?.view === "calendar" ? "calendar" : "list"

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, isPublic: true },
  })
  if (!community) notFound()

  const membership = session?.user?.id
    ? await prisma.membership.findFirst({
        where: { communityId: community.id, userId: session.user.id as string },
      })
    : null

  if (!community.isPublic && !membership) redirect(`/communities/${params.slug}`)

  const isStaff = membership && ["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)

  const events = await prisma.event.findMany({
    where: {
      communityId: community.id,
      status: isStaff
        ? { not: "ARCHIVED" }
        : { in: ["PUBLISHED", "ONGOING", "COMPLETED"] },
    },
    include: { _count: { select: { participants: true } } },
    orderBy: { startDate: "asc" },
  })

  const participations = session?.user?.id
    ? await prisma.eventParticipant.findMany({
        where: { userId: session.user.id as string, eventId: { in: events.map((e) => e.id) } },
        select: { eventId: true, status: true },
      })
    : []
  const participationMap = Object.fromEntries(participations.map((p) => [p.eventId, p.status]))

  const now = new Date()
  const ongoing = events.filter((e) => e.status === "ONGOING")
  const upcoming = events.filter((e) => ["DRAFT", "PUBLISHED"].includes(e.status) && new Date(e.startDate) >= now)
  const past = events.filter((e) => e.status === "COMPLETED")

  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    status: e.status,
    startDate: e.startDate.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/communities/${params.slug}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1">
            <ChevronLeft className="h-4 w-4" />
            {community.name}
          </Link>
          <h1 className="text-2xl font-bold">Événements</h1>
          <p className="text-sm text-muted-foreground">{community.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle vue */}
          <div className="flex items-center rounded-md border">
            <Link
              href={`/communities/${params.slug}/events`}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-l-md transition-colors ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="h-3.5 w-3.5" />
              Liste
            </Link>
            <Link
              href={`/communities/${params.slug}/events?view=calendar`}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-r-md transition-colors ${view === "calendar" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Calendrier
            </Link>
          </div>
          {isStaff && (
            <Button asChild>
              <Link href={`/communities/${params.slug}/events/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Créer
              </Link>
            </Button>
          )}
        </div>
      </div>

      {view === "calendar" ? (
        <EventCalendar events={calendarEvents} communitySlug={params.slug} />
      ) : (
        <>
          {events.length === 0 && (
            <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
              Aucun événement pour le moment.
            </div>
          )}

          {ongoing.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-green-600 dark:text-green-500">En cours</h2>
              {ongoing.map((event) => (
                <EventCard
                  key={event.id}
                  event={{ ...event, myStatus: participationMap[event.id] ?? null }}
                  slug={params.slug}
                />
              ))}
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">À venir</h2>
              {upcoming.map((event) => (
                <EventCard
                  key={event.id}
                  event={{ ...event, myStatus: participationMap[event.id] ?? null }}
                  slug={params.slug}
                />
              ))}
            </section>
          )}

          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Terminés</h2>
              {past.map((event) => (
                <EventCard
                  key={event.id}
                  event={{ ...event, myStatus: participationMap[event.id] ?? null }}
                  slug={params.slug}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
