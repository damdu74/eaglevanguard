import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ParticipateButton } from "@/components/events/participate-button"
import { EventStatusActions } from "@/components/events/event-status-actions"
import Link from "next/link"
import { ChevronLeft, Calendar, Clock, Users, Info } from "lucide-react"
import Image from "next/image"

interface PageProps {
  params: { slug: string; id: string }
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "Brouillon", variant: "outline" },
  PUBLISHED: { label: "Publié", variant: "secondary" },
  ONGOING: { label: "En cours", variant: "default" },
  COMPLETED: { label: "Terminé", variant: "outline" },
  CANCELLED: { label: "Annulé", variant: "destructive" },
}


export async function generateMetadata({ params }: PageProps) {
  const event = await prisma.event.findFirst({ where: { id: params.id, community: { slug: params.slug } } })
  return { title: event?.title ?? "Événement" }
}

export default async function EventDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  const event = await prisma.event.findFirst({
    where: { id: params.id, community: { slug: params.slug } },
    include: {
      community: { select: { id: true, name: true, isPublic: true } },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              steamName: true,
              discordName: true,
              name: true,
              customAvatar: true,
              steamAvatar: true,
              discordAvatar: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { participants: true } },
    },
  })

  if (!event) notFound()

  const membership = session?.user?.id
    ? await prisma.membership.findFirst({
        where: { communityId: event.community.id, userId: session.user.id as string },
      })
    : null

  if (!event.community.isPublic && !membership) notFound()

  const isStaff = membership && ["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)
  if (event.status === "DRAFT" && !isStaff) notFound()

  const myParticipation = session?.user?.id
    ? event.participants.find((p) => p.userId === session.user.id) ?? null
    : null

  const startDate = new Date(event.startDate)
  const endDate = event.endDate ? new Date(event.endDate) : null
  const statusInfo = STATUS_LABELS[event.status] ?? { label: event.status, variant: "outline" as const }

  const confirmed = event.participants.filter((p) => p.status === "CONFIRMED")
  const tentative = event.participants.filter((p) => p.status === "TENTATIVE")
  const declined = event.participants.filter((p) => p.status === "DECLINED")

  const canParticipate = ["PUBLISHED", "ONGOING"].includes(event.status)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href={`/communities/${params.slug}/events`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour aux événements
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{event.title}</h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              <Badge variant="outline">{event.type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{event.community.name}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isStaff && (
              <EventStatusActions
                communitySlug={params.slug}
                eventId={event.id}
                currentStatus={event.status as "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED"}
              />
            )}
            {canParticipate && (
              <ParticipateButton
                communitySlug={params.slug}
                eventId={event.id}
                currentStatus={myParticipation?.status as "CONFIRMED" | "TENTATIVE" | "DECLINED" | null ?? null}
                isMember={!!membership}
              />
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              {startDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              {startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              {endDate && (
                <> – {endDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              {event._count.participants} participant{event._count.participants > 1 ? "s" : ""}
              {event.maxSlots != null && ` / ${event.maxSlots} places`}
            </span>
          </div>
          {event.description && (
            <div className="flex items-start gap-2 text-sm pt-2 border-t">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants (visible aux membres) */}
      {membership && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { list: confirmed, label: "Présents", colorClass: "text-green-600" },
              { list: tentative, label: "Peut-être", colorClass: "text-yellow-600" },
              { list: declined, label: "Absents", colorClass: "text-muted-foreground" },
            ].map(({ list, label, colorClass }) =>
              list.length > 0 ? (
                <div key={label}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${colorClass}`}>
                    {label} ({list.length})
                  </p>
                  <div className="space-y-2">
                    {list.map(({ user }) => {
                      const avatar = user.customAvatar ?? user.steamAvatar ?? user.discordAvatar
                      const displayName = user.steamName ?? user.discordName ?? user.name ?? "Joueur"
                      return (
                        <div key={user.id} className="flex items-center gap-2 text-sm">
                          {avatar ? (
                            <Image
                              src={avatar}
                              alt={displayName}
                              width={24}
                              height={24}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                              {displayName[0]?.toUpperCase()}
                            </div>
                          )}
                          <span>{displayName}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null
            )}
            {event.participants.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun participant pour l&apos;instant.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
