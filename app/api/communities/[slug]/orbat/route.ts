import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: { slug: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    include: { orbat: true, orbatEdges: true },
  })

  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ nodes: community.orbat, edges: community.orbatEdges })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id as string, communityId: community.id },
    include: { rank: { select: { permissions: true } } },
  })
  const { isStaff } = await import("@/lib/permissions")
  if (!isStaff(membership)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { nodes, edges } = await req.json()

  await prisma.$transaction([
    prisma.orbatNode.deleteMany({ where: { communityId: community.id } }),
    prisma.orbatEdge.deleteMany({ where: { communityId: community.id } }),
    ...(nodes?.length
      ? [prisma.orbatNode.createMany({
          data: nodes.map((n: { id: string; type?: string; position: { x: number; y: number }; data?: Record<string, unknown> }) => ({
            communityId: community.id,
            nodeId: n.id,
            type: n.type ?? "unit",
            label: String(n.data?.label ?? "Unité"),
            positionX: n.position.x,
            positionY: n.position.y,
            data: n.data,
          })),
        })]
      : []),
    ...(edges?.length
      ? [prisma.orbatEdge.createMany({
          data: edges.map((e: { id: string; source: string; target: string; data?: Record<string, unknown> }) => ({
            communityId: community.id,
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
