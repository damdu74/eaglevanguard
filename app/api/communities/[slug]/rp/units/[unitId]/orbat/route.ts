import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isStaff } from "@/lib/permissions"

type Params = { params: { slug: string; unitId: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug }, select: { id: true } })
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const unit = await prisma.rpUnit.findUnique({
    where: { id: params.unitId },
    include: { orbatNodes: true, orbatEdges: true },
  })
  if (!unit || unit.communityId !== community.id) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ nodes: unit.orbatNodes, edges: unit.orbatEdges })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug }, select: { id: true } })
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const unit = await prisma.rpUnit.findUnique({ where: { id: params.unitId }, select: { id: true, communityId: true } })
  if (!unit || unit.communityId !== community.id) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id as string, communityId: community.id },
    include: { rank: { select: { permissions: true } } },
  })
  if (!isStaff(membership)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { nodes, edges } = await req.json()

  await prisma.$transaction([
    prisma.rpUnitOrbatNode.deleteMany({ where: { rpUnitId: unit.id } }),
    prisma.rpUnitOrbatEdge.deleteMany({ where: { rpUnitId: unit.id } }),
    ...(nodes?.length
      ? [prisma.rpUnitOrbatNode.createMany({
          data: nodes.map((n: { id: string; type?: string; position: { x: number; y: number }; data?: Record<string, unknown> }) => ({
            rpUnitId: unit.id,
            nodeId: n.id,
            type: n.type ?? "unit",
            label: String(n.data?.label ?? "Unité"),
            positionX: n.position.x,
            positionY: n.position.y,
            locked: Boolean(n.data?.locked ?? false),
            data: n.data,
          })),
        })]
      : []),
    ...(edges?.length
      ? [prisma.rpUnitOrbatEdge.createMany({
          data: edges.map((e: { id: string; source: string; target: string; data?: Record<string, unknown> }) => ({
            rpUnitId: unit.id,
            edgeId: e.id,
            source: e.source,
            target: e.target,
            data: e.data ?? null,
          })),
        })]
      : []),
  ])

  return NextResponse.json({ ok: true })
}
