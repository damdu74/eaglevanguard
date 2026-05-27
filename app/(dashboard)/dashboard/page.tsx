import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Users, Calendar, Shield, Plus, ClipboardList, ChevronRight } from "lucide-react"
import { CommunityLogo } from "@/components/community/community-logo"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = "force-dynamic"
export const metadata = { title: "Tableau de bord" }

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
  const displayName = session!.user!.name ?? "Joueur"

  const [memberships, upcomingEvents, pendingApplications] = await Promise.all([
    prisma.membership.findMany({
      where: { userId },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            _count: { select: { memberships: true } },
          },
        },
        rank: true,
      },
      orderBy: { joinedAt: "asc" },
      take: 6,
    }),
    prisma.event.findMany({
      where: {
        status: { in: ["PUBLISHED", "ONGOING"] },
        community: { memberships: { some: { userId } } },
        startDate: { gte: new Date() },
      },
      include: {
        community: { select: { name: true, slug: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
    prisma.application.findMany({
      where: {
        status: "PENDING",
        community: {
          memberships: {
            some: { userId, role: { in: ["OWNER", "ADMIN"] } },
          },
        },
      },
      include: {
        community: { select: { name: true, slug: true } },
        user: {
          select: {
            id: true, steamName: true, discordName: true, name: true,
            customAvatar: true, steamAvatar: true, discordAvatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  const totalMembers = memberships.reduce((acc, m) => acc + m.community._count.memberships, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">Bienvenue, {displayName}</p>
        </div>
        <Button disabled title="La création de communauté est temporairement désactivée">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle communauté
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Communautés</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{memberships.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Opérations à venir</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{upcomingEvents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total membres</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalMembers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Candidatures</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingApplications.length}</p>
            {pendingApplications.length > 0 && (
              <p className="text-xs text-orange-500 font-medium mt-0.5">en attente</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mes communautés */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Mes communautés</h2>
          {memberships.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <Shield className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Aucune communauté rejointe.</p>
                <Button asChild size="sm">
                  <Link href="/communities">Explorer l&apos;annuaire</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {memberships.map((m) => (
                <Link key={m.communityId} href={`/communities/${m.community.slug}`}>
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardContent className="flex items-center justify-between py-3 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <CommunityLogo url={m.community.logoUrl} name={m.community.name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{m.community.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.rank?.name ?? ROLE_LABELS[m.role] ?? m.role} · {m.community._count.memberships} membres
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          {/* Candidatures en attente */}
          {pendingApplications.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Candidatures en attente
                <Badge variant="destructive" className="text-white">{pendingApplications.length}</Badge>
              </h2>
              <div className="space-y-2">
                {pendingApplications.map((app) => {
                  const name = app.user.steamName ?? app.user.discordName ?? app.user.name ?? "Joueur"
                  const avatar = app.user.customAvatar ?? app.user.steamAvatar ?? app.user.discordAvatar
                  return (
                    <Link key={app.id} href={`/communities/${app.community.slug}/applications`}>
                      <Card className="transition-colors hover:bg-muted/50">
                        <CardContent className="flex items-center justify-between py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={avatar ?? undefined} />
                              <AvatarFallback className="text-xs">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{name}</p>
                              <p className="text-xs text-muted-foreground">
                                {app.community.name} · {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true, locale: fr })}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Opérations à venir */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Opérations à venir</h2>
            {upcomingEvents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Aucune opération planifiée.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <Link key={event.id} href={`/communities/${event.community.slug}/events`}>
                    <Card className="transition-colors hover:bg-muted/50">
                      <CardContent className="flex items-center justify-between py-3 px-4">
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.community.name} · {new Date(event.startDate).toLocaleDateString("fr-FR", {
                              weekday: "short", day: "numeric", month: "short",
                            })}
                            {event._count.participants > 0 && ` · ${event._count.participants} participants`}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
