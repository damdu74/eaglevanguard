import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  })
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [memberships, rpCharacters] = await Promise.all([
    prisma.membership.findMany({
      where: { communityId: community.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            steamName: true,
            discordName: true,
            customAvatar: true,
            steamAvatar: true,
            discordAvatar: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
    }),
    prisma.rpCharacter.findMany({
      where: { communityId: community.id },
      select: {
        userId: true,
        name: true,
        grade: true,
        rpUnit: { select: { columnConfig: true } },
      },
    }),
  ])

  // Résoudre l'icône de grade depuis la columnConfig de l'unité RP
  type ColOption = { label: string; icon?: string }
  type ColEntry  = { key: string; options?: ColOption[] }

  function resolveGradeIcon(grade: string | null, columnConfig: unknown): string | null {
    if (!grade || !columnConfig) return null
    const cols = columnConfig as ColEntry[]
    const gradeCol = cols.find((c) => c.key === "grade")
    return gradeCol?.options?.find((o) => o.label === grade)?.icon ?? null
  }

  const charByUser = new Map(
    rpCharacters.map((c) => [c.userId, {
      name: c.name,
      grade: c.grade ?? null,
      gradeIcon: resolveGradeIcon(c.grade, c.rpUnit?.columnConfig),
    }])
  )

  const members = memberships.map((m) => {
    const char = charByUser.get(m.userId)
    return {
      id: m.userId,
      name: m.user.steamName ?? m.user.discordName ?? m.user.name ?? "Inconnu",
      image: m.user.customAvatar ?? m.user.steamAvatar ?? m.user.discordAvatar ?? null,
      role: m.role,
      characterName: char?.name ?? null,
      gradeLabel: char?.grade ?? null,
      gradeIcon: char?.gradeIcon ?? null,
    }
  })

  return NextResponse.json({ members })
}
