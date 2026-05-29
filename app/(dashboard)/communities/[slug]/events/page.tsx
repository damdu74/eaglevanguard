import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/events/event-card"
import { EventCalendar } from "@/components/events/event-calendar"
import { EventsViewToggle } from "@/components/events/events-view-toggle"
import { EventsStatusFilter } from "@/components/events/events-status-filter"
import { AutoRefresh } from "@/components/ui/auto-refresh"
import { computeDisplayStatus } from "@/lib/event-status"
import Link from "next/link"
import { Plus, ChevronLeft } from "lucide-react"

interface PageProps {
  params: { slug: string }
  searchParams?: { view?: string; status?: string }
}

export async function generateMetadata({ params }: PageProps) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  return { title: community ? `Événements — ${community.name}` : "Événements" }
}

export default async function CommunityEventsPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  const view = searchParams?.view === "calendar" ? "calendar" : "list"
  const statusFilter = searchParams?.status ?? "all"

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
        ? { in: ["DRAFT", "PUBLISHED", "CANCELLED"] }
        : { in: ["PUBLISHED"] },
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

  // Calcul du statut affiché depuis les dates (pas depuis la DB)
  const eventsWithDisplay = events.map((e) => ({
    ...e,
    displayStatus: computeDisplayStatus(e.status, e.startDate, e.endDate),
  }))

  // Filtre par statut calculé
  const filtered = statusFilter === "all"
    ? eventsWithDisplay
    : eventsWithDisplay.filter((e) => {
        if (statusFilter === "DRAFT")     return e.displayStatus.label === "Brouillon"
        if (statusFilter === "ONGOING")   return e.displayStatus.label === "En cours"
        if (statusFilter === "UPCOMING")  return e.displayStatus.label === "À venir"
        if (statusFilter === "COMPLETED") return e.displayStatus.label === "Terminé"
        if (statusFilter === "CANCELLED") return e.displayStatus.label === "Annulé"
        return true
      })

  const ongoing   = filtered.filter((e) => e.displayStatus.label === "En cours")
  const upcoming  = filtered.filter((e) => e.displayStatus.label === "À venir")
  const completed = filtered.filter((e) => e.displayStatus.label === "Terminé")
  const drafts    = filtered.filter((e) => e.displayStatus.label === "Brouillon")
  const cancelled = filtered.filter((e) => e.displayStatus.label === "Annulé")

  const calendarEvents = eventsWithDisplay.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    status: e.status,
    startDate: e.startDate.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={30000} />
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
          <EventsStatusFilter isStaff={!!isStaff} currentStatus={statusFilter} />
          <EventsViewToggle currentView={view} />
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
          {filtered.length === 0 && (
            <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
              Aucun événement pour ce filtre.
            </div>
          )}

          {ongoing.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-green-600 dark:text-green-500">En cours</h2>
              {ongoing.map((event) => (
                <EventCard key={event.id} event={{ ...event, myStatus: participationMap[event.id] ?? null }} slug={params.slug} isStaff={!!isStaff} />
              ))}
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">À venir</h2>
              {upcoming.map((event) => (
                <EventCard key={event.id} event={{ ...event, myStatus: participationMap[event.id] ?? null }} slug={params.slug} isStaff={!!isStaff} />
              ))}
            </section>
          )}

          {completed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Terminés</h2>
              {completed.map((event) => (
                <EventCard key={event.id} event={{ ...event, myStatus: participationMap[event.id] ?? null }} slug={params.slug} isStaff={!!isStaff} />
              ))}
            </section>
          )}

          {drafts.length > 0 && isStaff && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Brouillons</h2>
              {drafts.map((event) => (
                <EventCard key={event.id} event={{ ...event, myStatus: participationMap[event.id] ?? null }} slug={params.slug} isStaff={!!isStaff} />
              ))}
            </section>
          )}

          {cancelled.length > 0 && isStaff && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-destructive/70">Annulés</h2>
              {cancelled.map((event) => (
                <EventCard key={event.id} event={{ ...event, myStatus: participationMap[event.id] ?? null }} slug={params.slug} isStaff={!!isStaff} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
