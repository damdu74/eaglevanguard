import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Calendar, Shield, UserCheck, ChevronRight } from "lucide-react"
import { computeDisplayStatus } from "@/lib/event-status"

export const dynamic = "force-dynamic"
export const metadata = { title: "Tableau de bord" }

const EV_SLUG = "eagle-vanguard"

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MODERATOR: "Modérateur",
  MEMBER: "Membre",
  RECRUIT: "Nouveau",
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id as string
  const displayName = session!.user!.name ?? "Soldat"

  const [community, friendsCount] = await Promise.all([
    prisma.community.findUnique({
      where: { slug: EV_SLUG },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { memberships: true } },
      },
    }),
    prisma.friendship.count({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
    }),
  ])

  const [membership, upcomingEvents] = await Promise.all([
    community
      ? prisma.membership.findUnique({
          where: { userId_communityId: { userId, communityId: community.id } },
          include: { rank: true },
        })
      : Promise.resolve(null),
    community
      ? prisma.event.findMany({
          where: {
            communityId: community.id,
            status: { in: ["PUBLISHED", "ONGOING"] },
          },
          select: {
            id: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true,
            _count: { select: { participants: true } },
          },
          orderBy: { startDate: "asc" },
          take: 5,
        })
      : Promise.resolve([]),
  ])

  const memberLabel = membership
    ? (membership.rank?.name ?? ROLE_LABELS[membership.role] ?? membership.role)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Bienvenue, {displayName}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Statut</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {memberLabel ? (
              <p className="text-2xl font-bold">{memberLabel}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Non membre</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Opérations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{upcomingEvents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Amis</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{friendsCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Événements à venir */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Prochaines opérations</h2>
        {upcomingEvents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Aucune opération planifiée.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((event) => {
              const displayStatus = computeDisplayStatus(event.status, event.startDate, event.endDate)
              const timeStart = new Date(event.startDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
              const timeEnd = event.endDate
                ? new Date(event.endDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                : null
              return (
                <Link key={event.id} href={`/communities/${EV_SLUG}/events/${event.id}`}>
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardContent className="flex items-center justify-between py-3 px-4">
                      <div className="space-y-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={displayStatus.variant} className={`text-xs ${displayStatus.className}`}>
                            {displayStatus.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.startDate).toLocaleDateString("fr-FR", {
                              weekday: "short", day: "numeric", month: "short",
                            })}{" "}
                            · {timeStart}{timeEnd && ` – ${timeEnd}`}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
