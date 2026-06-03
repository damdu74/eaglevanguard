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
        rank: { select: { name: true, iconUrl: true } },
      },
      orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
    }),
    prisma.rpCharacter.findMany({
      where: { communityId: community.id },
      select: { userId: true, name: true },
    }),
  ])

  const charByUser = new Map(rpCharacters.map((c) => [c.userId, c.name]))

  const members = memberships.map((m) => ({
    id: m.userId,
    name: m.user.steamName ?? m.user.discordName ?? m.user.name ?? "Inconnu",
    image: m.user.customAvatar ?? m.user.steamAvatar ?? m.user.discordAvatar ?? null,
    role: m.role,
    rankName: m.rank?.name ?? null,
    rankIcon: m.rank?.iconUrl ?? null,
    characterName: charByUser.get(m.userId) ?? null,
  }))

  return NextResponse.json({ members })
}
