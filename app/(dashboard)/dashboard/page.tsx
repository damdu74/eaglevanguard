import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { CommunityLogo } from "@/components/community/community-logo"
import { RpRoster } from "@/components/community/rp-roster"
import { GitBranch } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const metadata = { title: "Tableau de bord" }

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const displayName = session!.user!.name ?? "Soldat"
  const isEV = session?.user?.isEagleVanguardTeam
  const userId = session?.user?.id as string

  const allCommunities = isEV
    ? await prisma.community.findMany({
        select: { id: true, name: true, slug: true, logoUrl: true, game: true },
        orderBy: { name: "asc" },
      })
    : []

  const membershipRows = !isEV
    ? await prisma.membership.findMany({
        where: { userId },
        select: {
          role: true,
          rank: { select: { permissions: true } },
          community: {
            select: { id: true, name: true, slug: true, logoUrl: true, game: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      })
    : []

  const communitiesWithUnits = await Promise.all(
    (isEV ? allCommunities : membershipRows.map(m => m.community)).map(async (community) => {
      const units = await prisma.rpUnit.findMany({
        where: { communityId: community.id },
        select: {
          id: true, name: true, description: true, era: true, game: true, columnConfig: true,
          _count: { select: { characters: true } },
          orbatNodes: { where: { nodeId: "root" }, select: { data: true }, take: 1 },
        },
        orderBy: { createdAt: "asc" },
      })

      const membership = isEV
        ? null
        : membershipRows.find(m => m.community.id === community.id)

      const isStaff = isEV || (!!membership && ["OWNER", "ADMIN", "MODERATOR"].includes(membership.role))

      return {
        community,
        isStaff,
        units: units.map(u => ({
          ...u,
          game: u.game ?? null,
          imageUrl: (u.orbatNodes[0]?.data as Record<string, unknown> | null)?.imageUrl as string | null ?? null,
        })),
      }
    })
  )

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
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Organigramme</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allCommunities.map((community) => (
              <Link key={community.id} href={`/communities/${community.slug}/orbat`}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center gap-3 py-4 px-4">
                    <CommunityLogo url={community.logoUrl} name={community.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">Organigramme</p>
                      <p className="text-xs text-muted-foreground truncate">{community.name}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {communitiesWithUnits.map(({ community, units, isStaff }) => (
        <div key={community.id} className="space-y-3">
          <div className="flex items-center gap-3">
            <CommunityLogo url={community.logoUrl} name={community.name} size="sm" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {community.name} — Unités
            </h2>
          </div>
          <RpRoster
            communitySlug={community.slug}
            units={units}
            isStaff={isStaff}
          />
        </div>
      ))}
    </div>
  )
}
