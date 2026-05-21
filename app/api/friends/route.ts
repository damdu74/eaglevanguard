import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const userId = session.user.id

  const [accepted, received, sent] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
      include: {
        requester: { select: { id: true, steamName: true, discordName: true, name: true, customAvatar: true, steamAvatar: true, discordAvatar: true, image: true } },
        receiver: { select: { id: true, steamName: true, discordName: true, name: true, customAvatar: true, steamAvatar: true, discordAvatar: true, image: true } },
      },
    }),
    prisma.friendship.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: {
        requester: { select: { id: true, steamName: true, discordName: true, name: true, customAvatar: true, steamAvatar: true, discordAvatar: true, image: true } },
      },
    }),
    prisma.friendship.findMany({
      where: { requesterId: userId, status: "PENDING" },
      include: {
        receiver: { select: { id: true, steamName: true, discordName: true, name: true, customAvatar: true, steamAvatar: true, discordAvatar: true, image: true } },
      },
    }),
  ])

  const friends = accepted.map((f) => ({
    friendshipId: f.id,
    user: f.requesterId === userId ? f.receiver : f.requester,
  }))

  return NextResponse.json({ friends, received, sent })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { userId: targetId } = await req.json()
  if (!targetId || targetId === session.user.id) {
    return NextResponse.json({ error: "Utilisateur invalide" }, { status: 400 })
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: session.user.id, receiverId: targetId },
        { requesterId: targetId, receiverId: session.user.id },
      ],
    },
  })

  if (existing) return NextResponse.json({ error: "Relation déjà existante" }, { status: 409 })

  const friendship = await prisma.friendship.create({
    data: { requesterId: session.user.id, receiverId: targetId },
  })

  return NextResponse.json(friendship, { status: 201 })
}
