import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const actions = await prisma.moderationAction.findMany({
    where: { targetId: session.user.id },
    select: {
      id: true,
      type: true,
      reason: true,
      createdAt: true,
      expiresAt: true,
      resolvedAt: true,
      moderator: { select: { id: true, name: true, steamName: true } },
      community: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(actions)
}
