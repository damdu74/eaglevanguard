import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const friendship = await prisma.friendship.findUnique({ where: { id: params.id } })
  if (!friendship) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })
  if (friendship.receiverId !== session.user.id) return NextResponse.json({ error: "Interdit" }, { status: 403 })
  if (friendship.status !== "PENDING") return NextResponse.json({ error: "Déjà traité" }, { status: 409 })

  const [updated] = await prisma.$transaction([
    prisma.friendship.update({ where: { id: params.id }, data: { status: "ACCEPTED" } }),
    prisma.notification.create({
      data: {
        userId: friendship.requesterId,
        type: "FRIEND_ACCEPTED",
        message: `Votre demande d'ami a été acceptée.`,
        link: `/players/friends`,
      },
    }),
  ])

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const friendship = await prisma.friendship.findUnique({ where: { id: params.id } })
  if (!friendship) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

  const isInvolved = friendship.requesterId === session.user.id || friendship.receiverId === session.user.id
  if (!isInvolved) return NextResponse.json({ error: "Interdit" }, { status: 403 })

  await prisma.friendship.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
