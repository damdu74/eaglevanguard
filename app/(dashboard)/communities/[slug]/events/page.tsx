import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/events/event-card"
import Link from "next/link"
import { Plus, ChevronLeft } from "lucide-react"

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  return { title: community ? `Événements — ${community.name}` : "Événements" }
}

export default async function CommunityEventsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

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
      ...(!isStaff ? { status: { in: ["PUBLISHED", "ONGOING", "COMPLETED"] } } : {}),
    },
    include: { _count: { select: { participants: true } } },
    orderBy: { startDate: "asc" },
  })

  // Attach user's participation status
  const participations = session?.user?.id
    ? await prisma.eventParticipant.findMany({
        where: { userId: session.user.id as string, eventId: { in: events.map((e) => e.id) } },
        select: { eventId: true, status: true },
      })
    : []
  const participationMap = Object.fromEntries(participations.map((p) => [p.eventId, p.status]))

  const now = new Date()
  const upcoming = events.filter(
    (e) => new Date(e.startDate) >= now && ["DRAFT", "PUBLISHED", "ONGOING"].includes(e.status)
  )
  const past = events.filter((e) => e.status === "COMPLETED" || new Date(e.startDate) < now && e.status !== "DRAFT")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/communities/${params.slug}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1">
            <ChevronLeft className="h-4 w-4" />
            Retour à la communauté
          </Link>
          <h1 className="text-2xl font-bold">Événements</h1>
          <p className="text-sm text-muted-foreground">{community.name}</p>
        </div>
        {isStaff && (
          <Button asChild>
            <Link href={`/communities/${params.slug}/events/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un événement
            </Link>
          </Button>
        )}
      </div>

      {events.length === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Aucun événement pour le moment.
        </div>
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Passés</h2>
          {past.map((event) => (
            <EventCard
              key={event.id}
              event={{ ...event, myStatus: participationMap[event.id] ?? null }}
              slug={params.slug}
            />
          ))}
        </section>
      )}
    </div>
  )
}
