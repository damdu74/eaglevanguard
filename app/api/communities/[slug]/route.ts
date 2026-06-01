import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"
import { z } from "zod"
import { hasCommunityPermission } from "@/lib/permissions"

const patchSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  slug: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(10000).nullable().optional(),
  logoUrl: z.string().url().max(500).nullable().optional(),
  bannerUrl: z.string().url().max(500).nullable().optional(),
  isPublic: z.boolean().optional(),
})

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
    },
    include: { rank: { select: { permissions: true } } },
  })

  if (!hasCommunityPermission(membership, "MANAGE_SETTINGS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { success } = rateLimit(`community-patch:${session.user.id}`, 20, 60_000)
  if (!success) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 })

  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  const body = parsed.data

  if (body.slug && body.slug !== params.slug) {
    const taken = await prisma.community.findUnique({ where: { slug: body.slug } })
    if (taken) return NextResponse.json({ error: "Cet identifiant est déjà utilisé" }, { status: 409 })
  }

  const community = await prisma.community.update({
    where: { slug: params.slug },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.slug && { slug: body.slug }),
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
