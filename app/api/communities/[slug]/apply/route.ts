import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Params {
  params: { slug: string }
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const existing = await prisma.membership.findFirst({
    where: { communityId: community.id, userId: session.user.id as string },
  })
  if (existing) return NextResponse.json({ error: "Vous êtes déjà membre" }, { status: 400 })

  const { message } = await req.json()

  const application = await prisma.application.upsert({
    where: { communityId_userId: { communityId: community.id, userId: session.user.id as string } },
    create: {
      communityId: community.id,
      userId: session.user.id as string,
      message: message ?? null,
      status: "PENDING",
    },
    update: {
      message: message ?? null,
      status: "PENDING",
      response: null,
    },
  })

  return NextResponse.json(application, { status: 201 })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const application = await prisma.application.findUnique({
    where: { communityId_userId: { communityId: community.id, userId: session.user.id as string } },
  })
  if (!application || application.status !== "PENDING") {
    return NextResponse.json({ error: "Aucune candidature en attente" }, { status: 400 })
  }

  await prisma.application.update({
    where: { id: application.id },
    data: { status: "WITHDRAWN" },
  })

  return NextResponse.json({ ok: true })
}
