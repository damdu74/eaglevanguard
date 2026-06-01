import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { hasCommunityPermission } from "@/lib/permissions"

interface Params {
  params: { slug: string; id: string }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const adminMembership = await prisma.membership.findFirst({
    where: {
      communityId: community.id,
      userId: session.user.id as string,
    },
    include: { rank: { select: { permissions: true } } },
  })
  if (!hasCommunityPermission(adminMembership, "MANAGE_APPLICATIONS")) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
  }

  const application = await prisma.application.findFirst({
    where: { id: params.id, communityId: community.id },
  })
  if (!application) return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 })
  if (application.status !== "PENDING") {
    return NextResponse.json({ error: "Candidature déjà traitée" }, { status: 400 })
  }

  const { action, response } = await req.json()
  if (!["accept", "reject"].includes(action)) {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 })
  }

  if (action === "accept") {
    const alreadyMember = await prisma.membership.findUnique({
      where: { userId_communityId: { userId: application.userId, communityId: community.id } },
    })
    if (alreadyMember) {
      await prisma.application.update({
        where: { id: application.id },
        data: { status: "ACCEPTED", response: response ?? null },
      })
      return NextResponse.json({ ok: true })
    }

    await prisma.$transaction([
      prisma.application.update({
        where: { id: application.id },
        data: { status: "ACCEPTED", response: response ?? null },
      }),
      prisma.membership.create({
        data: { communityId: community.id, userId: application.userId, role: "RECRUIT" },
      }),
      prisma.notification.create({
        data: {
          userId: application.userId,
          type: "APPLICATION_ACCEPTED",
          message: `Votre candidature à « ${community.name} » a été acceptée.`,
          link: `/communities/${community.slug}`,
        },
      }),
    ])

    await createAuditLog({
      action: "APPLICATION_ACCEPTED",
      description: `Candidature acceptée — membre rejoint « ${community.name} »`,
      actorId: session.user.id as string,
      targetId: application.userId,
      communityId: community.id,
    })
  } else {
    await prisma.$transaction([
      prisma.application.update({
        where: { id: application.id },
        data: { status: "REJECTED", response: response ?? null },
      }),
      prisma.notification.create({
        data: {
          userId: application.userId,
          type: "APPLICATION_REJECTED",
          message: `Votre candidature à « ${community.name} » a été refusée.`,
          link: `/communities/${community.slug}/apply`,
        },
      }),
    ])

    await createAuditLog({
      action: "APPLICATION_REJECTED",
      description: `Candidature refusée dans « ${community.name} »`,
      actorId: session.user.id as string,
      targetId: application.userId,
      communityId: community.id,
    })
  }

  return NextResponse.json({ ok: true })
}
