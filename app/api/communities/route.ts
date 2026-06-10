import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { createAuditLog } from "@/lib/audit"
import { CommunityVisibility } from "@prisma/client"

const createSchema = z.object({
  name: z.string().min(3).max(50),
  slug: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  game: z.string().min(1),
  language: z.string().default("fr"),
  visibility: z.enum(["PUBLIC", "WHITELIST", "INVISIBLE"]).default("WHITELIST"),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const isEagleVanguardTeam = session?.user?.isEagleVanguardTeam ?? false

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12") || 12))
  const game = searchParams.get("game")
  const search = searchParams.get("search")

  const visibilityFilter = isEagleVanguardTeam
    ? {}
    : { visibility: { in: [CommunityVisibility.PUBLIC, CommunityVisibility.WHITELIST] } }

  const where = {
    ...visibilityFilter,
    ...(game && { game }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  }

  const [communities, total] = await Promise.all([
    prisma.community.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { memberships: true, events: true } },
      },
    }),
    prisma.community.count({ where }),
  ])

  return NextResponse.json({ communities, total, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, slug, description, game, language, visibility } = parsed.data

  const existing = await prisma.community.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: "Cet identifiant est déjà pris" }, { status: 409 })
  }

  const community = await prisma.$transaction(async (tx) => {
    const created = await tx.community.create({
      data: {
        name,
        slug,
        description,
        game,
        language,
        visibility,
        creatorId: session.user.id,
        memberships: {
          create: { userId: session.user.id, role: "OWNER" },
        },
      },
    })

    const fondateur = await tx.rank.create({
      data: {
        communityId: created.id,
        name: "Fondateur",
        order: 0,
        isPermanent: true,
      },
    })

    await tx.membership.update({
      where: { userId_communityId: { userId: session.user.id as string, communityId: created.id } },
      data: { rankId: fondateur.id },
    })

    return created
  })

  await createAuditLog({
    action: "COMMUNITY_CREATED",
    description: `Communauté « ${community.name} » créée`,
    actorId: session.user.id,
    communityId: community.id,
    metadata: { slug: community.slug, game: community.game },
  })

  return NextResponse.json(community, { status: 201 })
}
