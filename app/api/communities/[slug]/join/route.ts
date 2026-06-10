import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"
import { createAuditLog } from "@/lib/audit"

interface Params {
  params: { slug: string }
}

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { success } = rateLimit(`join:${session.user.id}`, 5, 60_000)
  if (!success) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  if (community.visibility !== "PUBLIC") {
    return NextResponse.json({ error: "Cette communauté requiert une candidature" }, { status: 403 })
  }

  const existing = await prisma.membership.findFirst({
    where: { communityId: community.id, userId: session.user.id as string },
  })
  if (existing) return NextResponse.json({ error: "Vous êtes déjà membre" }, { status: 400 })

  await prisma.membership.create({
    data: {
      communityId: community.id,
      userId: session.user.id as string,
      role: "RECRUIT",
    },
  })

  await createAuditLog({
    action: "MEMBER_JOINED",
    description: `A rejoint la communauté « ${community.name} »`,
    actorId: session.user.id as string,
    communityId: community.id,
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
