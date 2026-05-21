import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ROLE_POWER: Record<string, number> = {
  OWNER: 4,
  ADMIN: 3,
  MODERATOR: 2,
  MEMBER: 1,
  RECRUIT: 0,
}

interface Params {
  params: { slug: string; userId: string }
}

async function getActorAndTarget(slug: string, actorUserId: string, targetUserId: string) {
  const community = await prisma.community.findUnique({ where: { slug } })
  if (!community) return null

  const [actor, target] = await Promise.all([
    prisma.membership.findFirst({ where: { communityId: community.id, userId: actorUserId } }),
    prisma.membership.findFirst({ where: { communityId: community.id, userId: targetUserId } }),
  ])

  return { community, actor, target }
}

// PATCH — change role or rank
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const result = await getActorAndTarget(params.slug, session.user.id as string, params.userId)
  if (!result) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const { actor, target } = result
  if (!actor || !target) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 })

  const actorPower = ROLE_POWER[actor.role] ?? -1
  const targetPower = ROLE_POWER[target.role] ?? -1

  if (actorPower <= targetPower) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
  }

  const body = await req.json()
  let hasUpdate = false

  if (body.role !== undefined) {
    if (body.role === "RECRUIT") {
      return NextResponse.json({ error: "Le rôle Nouveau est automatique et ne peut pas être attribué manuellement" }, { status: 403 })
    }
    const newRolePower = ROLE_POWER[body.role] ?? -1
    if (newRolePower >= actorPower) {
      return NextResponse.json({ error: "Vous ne pouvez pas attribuer ce rôle" }, { status: 403 })
    }
    hasUpdate = true
  }
  if ("rankId" in body) hasUpdate = true

  if (!hasUpdate) {
    return NextResponse.json({ error: "Aucune modification" }, { status: 400 })
  }

  await prisma.membership.update({
    where: { id: target.id },
    data: {
      ...(body.role !== undefined ? { role: body.role } : {}),
      ...("rankId" in body ? { rankId: body.rankId ?? null } : {}),
    },
  })

  return NextResponse.json({ ok: true })
}

// DELETE — kick member
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const result = await getActorAndTarget(params.slug, session.user.id as string, params.userId)
  if (!result) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const { actor, target } = result
  if (!actor || !target) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 })

  const actorPower = ROLE_POWER[actor.role] ?? -1
  const targetPower = ROLE_POWER[target.role] ?? -1

  if (actorPower <= targetPower) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
  }

  await prisma.membership.delete({ where: { id: target.id } })

  return NextResponse.json({ ok: true })
}
