import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

type Params = { params: { slug: string; templateId: string } }

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const membership = await prisma.membership.findFirst({
    where: {
      communityId: community.id,
      userId: session.user.id,
      role: { in: ["OWNER", "ADMIN", "MODERATOR"] },
    },
  })
  if (!membership) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const template = await prisma.eventTemplate.findFirst({
    where: { id: params.templateId, communityId: community.id },
  })
  if (!template) return NextResponse.json({ error: "Template introuvable" }, { status: 404 })

  await prisma.eventTemplate.delete({ where: { id: params.templateId } })

  return NextResponse.json({ success: true })
}
