import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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

  if (!isEV && membershipRows.length === 0) {
    const community = await prisma.community.findFirst({ orderBy: { createdAt: "asc" } })
    const application = community
      ? await prisma.application.findUnique({
          where: { communityId_userId: { communityId: community.id, userId } },
        })
      : null

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">Bienvenue, {displayName}</p>
        </div>
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          {application?.status === "PENDING" ? (
            <>
              <p className="text-muted-foreground text-sm">Votre candidature est en attente d&apos;examen.</p>
              <Button asChild variant="outline">
                <Link href="/candidatures">Voir ma candidature</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">Vous n&apos;êtes pas encore membre de la communauté.</p>
              <Button asChild>
                <Link href="/candidatures">Faire une candidature</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

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

  const orbatData = isEV
    ? await Promise.all(
        allCommunities.map(async (community) => {
          const [communityOrbat, rpUnits, unitOrbatRoots] = await Promise.all([
            prisma.community.findUnique({
              where: { id: community.id },
              select: { orbat: true, orbatEdges: true },
            }),
            prisma.rpUnit.findMany({
              where: { communityId: community.id },
              select: { id: true, name: true, game: true },
              orderBy: { createdAt: "asc" },
            }),
            prisma.rpUnitOrbatNode.findMany({
              where: { rpUnit: { communityId: community.id }, nodeId: "root" },
              select: { rpUnitId: true, label: true, data: true },
            }),
          ])

          const unitRootData: Record<string, Record<string, unknown>> = {}
          for (const root of unitOrbatRoots) {
            unitRootData[root.rpUnitId] = {
              ...((root.data as Record<string, unknown>) ?? {}),
              label: root.label,
            }
          }

          const nodes = (communityOrbat?.orbat ?? []).map((n) => ({
            id: n.nodeId,
            type: n.type ?? undefined,
            position: { x: n.positionX, y: n.positionY },
            data: { ...((n.data as Record<string, unknown>) ?? { label: n.label }), locked: n.locked },
          }))

          const edges = (communityOrbat?.orbatEdges ?? []).map((e) => ({
            id: e.edgeId,
            source: e.source,
            target: e.target,
            ...((e.data as object) ?? {}),
          }))

          return { community, nodes, edges, rpUnits, unitRootData }
        })
      )
    : []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Bienvenue, {displayName}</p>
      </div>

      <DashboardTabs
        isEV={!!isEV}
        allCommunities={allCommunities}
        communitiesWithUnits={communitiesWithUnits}
        orbatData={orbatData}
      />
    </div>
  )
}
