import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, Calendar, Shield, Plus } from "lucide-react"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)!
  const userId = session!.user!.id as string

  const [memberships, upcomingEvents] = await Promise.all([
    prisma.membership.findMany({
      where: { userId },
      include: {
        community: {
          include: { _count: { select: { memberships: true } } },
        },
        rank: true,
      },
      take: 6,
    }),
    prisma.event.findMany({
      where: {
        status: { in: ["PUBLISHED", "ONGOING"] },
        community: { memberships: { some: { userId } } },
        startDate: { gte: new Date() },
      },
      include: { community: { select: { name: true, slug: true } } },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <Button asChild>
          <Link href="/communities/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle communauté
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
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
            <p className="text-2xl font-bold">
              {memberships.reduce((acc, m) => acc + m.community._count.memberships, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Communities */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Mes communautés</h2>
        {memberships.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium">Aucune communauté</p>
                <p className="text-sm text-muted-foreground">Créez ou rejoignez une communauté MILSIM.</p>
              </div>
              <Button asChild>
                <Link href="/communities">Explorer</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map((m) => (
              <Link key={m.communityId} href={`/communities/${m.community.slug}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-base">{m.community.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {m.rank?.name ?? m.role} · {m.community._count.memberships} membres
                    </p>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Opérations à venir</h2>
          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <Card key={event.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.community.name} ·{" "}
                      {new Date(event.startDate).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/communities/${event.community.slug}/events`}>Voir</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
