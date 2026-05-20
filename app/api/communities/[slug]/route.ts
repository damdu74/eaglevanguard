import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: { slug: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      ranks: { orderBy: { order: "asc" } },
      units: true,
      _count: { select: { memberships: true, events: true } },
    },
  })

  if (!community) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(community)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      community: { slug: params.slug },
      role: { in: ["OWNER", "ADMIN"] },
    },
  })

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const community = await prisma.community.update({
    where: { slug: params.slug },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
      ...(body.bannerUrl !== undefined && { bannerUrl: body.bannerUrl }),
      ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
    },
  })

  return NextResponse.json(community)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
  })

  if (!community || community.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.community.delete({ where: { slug: params.slug } })
  return new NextResponse(null, { status: 204 })
}
