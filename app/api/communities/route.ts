import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(3).max(50),
  slug: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  game: z.string().min(1),
  language: z.string().default("fr"),
  isPublic: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = parseInt(searchParams.get("limit") ?? "12")
  const game = searchParams.get("game")
  const search = searchParams.get("search")

  const where = {
    isPublic: true,
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

  const { name, slug, description, game, language, isPublic } = parsed.data

  const existing = await prisma.community.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: "Cet identifiant est déjà pris" }, { status: 409 })
  }

  const community = await prisma.community.create({
    data: {
      name,
      slug,
      description,
      game,
      language,
      isPublic,
      creatorId: session.user.id,
      memberships: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
  })

  return NextResponse.json(community, { status: 201 })
}
