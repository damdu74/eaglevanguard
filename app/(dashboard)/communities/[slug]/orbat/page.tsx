import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OrbatEditor } from "@/components/orbat/orbat-editor"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata() {
  return { title: "Organigramme" }
}

export default async function OrbatPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isEagleVanguardTeam) redirect(`/communities/${params.slug}`)

  const [community, rpUnits] = await Promise.all([
    prisma.community.findUnique({
      where: { slug: params.slug },
      include: {
        orbat: true,
        orbatEdges: true,
        memberships: session?.user?.id
          ? { where: { userId: session.user.id as string } }
          : false,
      },
    }),
    prisma.rpUnit.findMany({
      where: { community: { slug: params.slug } },
      select: { id: true, name: true, game: true },
      orderBy: { createdAt: "asc" },
    }),
  ])

  // Nœud racine de chaque ORBAT d'unité (pour peupler automatiquement les cases)
  const unitOrbatRoots = community
    ? await prisma.rpUnitOrbatNode.findMany({
        where: { rpUnit: { communityId: community.id }, nodeId: "root" },
        select: { rpUnitId: true, label: true, data: true },
      })
    : []

  const unitRootData: Record<string, Record<string, unknown>> = {}
  for (const root of unitOrbatRoots) {
    unitRootData[root.rpUnitId] = {
      ...((root.data as Record<string, unknown>) ?? {}),
      label: root.label,
    }
  }

  if (!community) notFound()

  const membership = community.memberships?.[0]
  const canEdit = membership && ["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)

  const nodes = community.orbat.map((n) => ({
    id: n.nodeId,
    type: n.type,
    position: { x: n.positionX, y: n.positionY },
    data: {
      ...((n.data as Record<string, unknown>) ?? { label: n.label }),
      locked: n.locked,
    },
  }))

  const edges = community.orbatEdges.map((e) => ({
    id: e.edgeId,
    source: e.source,
    target: e.target,
    ...(e.data as object ?? {}),
  }))

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/communities/${params.slug}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1">
          <ChevronLeft className="h-4 w-4" />
          {community.name}
        </Link>
        <h1 className="text-2xl font-bold">Organigramme — {community.name}</h1>
        <p className="text-sm text-muted-foreground">Ordre de bataille général de la communauté</p>
      </div>
      <OrbatEditor
        communitySlug={params.slug}
        rootLabel={community.name}
        communityLogoUrl={community.logoUrl}
        communityUnits={rpUnits}
        unitRootData={unitRootData}
        initialNodes={nodes}
        initialEdges={edges}
        readOnly={!canEdit}
      />
    </div>
  )
}
