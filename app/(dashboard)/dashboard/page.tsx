import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { CommunityLogo } from "@/components/community/community-logo"
import { GitBranch, Sword } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const metadata = { title: "Tableau de bord" }

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const displayName = session!.user!.name ?? "Soldat"
  const isEV = session?.user?.isEagleVanguardTeam
  const userId = session?.user?.id as string

  const [allCommunities, memberCommunities] = await Promise.all([
    isEV
      ? prisma.community.findMany({
          select: { id: true, name: true, slug: true, logoUrl: true, game: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    !isEV
      ? prisma.membership.findMany({
          where: { userId },
          select: {
            community: {
              select: { id: true, name: true, slug: true, logoUrl: true, game: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        }).then(ms => ms.map(m => m.community))
      : Promise.resolve([]),
  ])

  const registreCommunities = isEV ? allCommunities : memberCommunities

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Bienvenue, {displayName}</p>
      </div>

      {isEV && allCommunities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">ORBAT Général</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allCommunities.map((community) => (
              <Link key={community.id} href={`/communities/${community.slug}/orbat`}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center gap-3 py-4 px-4">
                    <CommunityLogo url={community.logoUrl} name={community.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{community.name}</p>
                      <p className="text-xs text-muted-foreground">{community.game}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {registreCommunities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sword className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Registre des effectifs</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {registreCommunities.map((community) => (
              <Link key={community.id} href={`/communities/${community.slug}/rp`}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center gap-3 py-4 px-4">
                    <CommunityLogo url={community.logoUrl} name={community.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{community.name}</p>
                      <p className="text-xs text-muted-foreground">{community.game}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
