import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ParticipateButton } from "@/components/events/participate-button"
import { EventStatusActions } from "@/components/events/event-status-actions"
import { RichTextContent } from "@/components/ui/rich-text-content"
import { LocalDate, LocalTime } from "@/components/ui/local-date-time"
import Link from "next/link"
import { ChevronLeft, Calendar, Clock, Users, Info, Pencil } from "lucide-react"
import Image from "next/image"
import { AutoRefresh } from "@/components/ui/auto-refresh"
import { computeDisplayStatus } from "@/lib/event-status"

interface PageProps {
  params: { slug: string; id: string }
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

  const startIso = event.startDate.toISOString()
  const endIso = event.endDate?.toISOString() ?? null
  const statusInfo = computeDisplayStatus(event.status, event.startDate, event.endDate ?? null)

  const confirmed = event.participants.filter((p) => p.status === "CONFIRMED")
  const tentative = event.participants.filter((p) => p.status === "TENTATIVE")
  const declined = event.participants.filter((p) => p.status === "DECLINED")

  const canParticipate = event.status === "PUBLISHED" &&
    ["À venir", "En cours"].includes(statusInfo.label)

  return (
    <div className="space-y-6 max-w-3xl">
      <AutoRefresh intervalMs={60000} />
      <div>
        <Link
          href={`/communities/${params.slug}/events`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Événements
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
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/communities/${params.slug}/events/${event.id}/edit`}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Modifier
                  </Link>
                </Button>
                <EventStatusActions
                  communitySlug={params.slug}
                  eventId={event.id}
                  currentStatus={event.status as "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED"}
                />
              </>
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
            <LocalDate iso={startIso} options={{ weekday: "long", day: "numeric", month: "long", year: "numeric" }} />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <LocalTime iso={startIso} />
            {endIso && <> – <LocalTime iso={endIso} /></>}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              {event._count.participants} participant{event._count.participants > 1 ? "s" : ""}
              {event.maxSlots != null && ` / ${event.maxSlots} places`}
            </span>
          </div>
          {event.description && (
            <div className="flex items-start gap-2 pt-2 border-t">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <RichTextContent html={event.description} />
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
