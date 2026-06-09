import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OrbatEditor } from "@/components/orbat/orbat-editor"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface PageProps {
  params: { slug: string; unitId: string }
  searchParams?: { from?: string }
}

export async function generateMetadata({ params }: PageProps) {
  const unit = await prisma.rpUnit.findUnique({ where: { id: params.unitId }, select: { name: true } })
  return { title: unit ? `ORBAT — ${unit.name}` : "ORBAT" }
}

export default async function RpUnitOrbatPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  const community = await prisma.community.findUnique({ where: { slug: params.slug }, select: { id: true, name: true, isPublic: true } })
  if (!community) notFound()

  const membership = session?.user?.id
    ? await prisma.membership.findFirst({
        where: { communityId: community.id, userId: session.user.id as string },
        include: { rank: { select: { permissions: true } } },
      })
    : null

  if (!community.isPublic && !membership) redirect(`/communities/${params.slug}`)

  const unit = await prisma.rpUnit.findUnique({
    where: { id: params.unitId },
    include: { orbatNodes: true, orbatEdges: true },
  })
  if (!unit || unit.communityId !== community.id) notFound()

  const canEdit = !!membership && ["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)

  const nodes = unit.orbatNodes.map((n) => ({
    id: n.nodeId,
    type: n.type,
    position: { x: n.positionX, y: n.positionY },
    data: {
      ...((n.data as Record<string, unknown>) ?? { label: n.label }),
      locked: n.locked,
    },
  }))

  const edges = unit.orbatEdges.map((e) => ({
    id: e.edgeId,
    source: e.source,
    target: e.target,
    ...(e.data as object ?? {}),
  }))

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={searchParams?.from === "orbat-general"
            ? `/communities/${params.slug}/orbat`
            : `/communities/${params.slug}/rp/${unit.id}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {searchParams?.from === "orbat-general" ? "ORBAT Général" : unit.name}
        </Link>
        <h1 className="text-2xl font-bold">ORBAT — {unit.name}</h1>
        <p className="text-sm text-muted-foreground">Ordre de bataille de l&apos;unité</p>
      </div>
      <OrbatEditor
        communitySlug={params.slug}
        unitId={unit.id}
        rootLabel={unit.name}
        initialNodes={nodes}
        initialEdges={edges}
        readOnly={!canEdit}
      />
    </div>
  )
}
