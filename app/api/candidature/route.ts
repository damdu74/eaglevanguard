import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const userId = session.user.id as string
  const { message } = await req.json()

  const community = await prisma.community.findFirst({ orderBy: { createdAt: "asc" } })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const existing = await prisma.application.findUnique({
    where: { communityId_userId: { communityId: community.id, userId } },
  })

  if (existing && existing.status === "PENDING") {
    return NextResponse.json({ error: "Candidature déjà en cours" }, { status: 409 })
  }

  if (existing) {
    const updated = await prisma.application.update({
      where: { id: existing.id },
      data: { status: "PENDING", message: message?.trim() || null, response: null },
    })
    return NextResponse.json(updated, { status: 200 })
  }

  const application = await prisma.application.create({
    data: { communityId: community.id, userId, message: message?.trim() || null },
  })

  return NextResponse.json(application, { status: 201 })
}
