import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const userSelect = {
  id: true,
  steamName: true,
  discordName: true,
  name: true,
  customAvatar: true,
  steamAvatar: true,
  discordAvatar: true,
  image: true,
}

async function getConversationForUser(conversationId: string, userId: string) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: { select: userSelect },
      user2: { select: userSelect },
    },
  })
}

export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const userId = session.user.id
  const conv = await getConversationForUser(params.conversationId, userId)
  if (!conv) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 })

  const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1

  const cursor = req.nextUrl.searchParams.get("cursor")

  const messages = await prisma.message.findMany({
    where: {
      conversationId: conv.id,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    include: { sender: { select: userSelect } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const [isBlocked, isBlockedBy] = await Promise.all([
    prisma.block.findFirst({ where: { blockerId: userId, blockedId: otherUser.id } }),
    prisma.block.findFirst({ where: { blockerId: otherUser.id, blockedId: userId } }),
  ])

  return NextResponse.json({
    messages: messages.reverse(),
    otherUser,
    isBlocked: !!isBlocked,
    isBlockedBy: !!isBlockedBy,
    hasMore: messages.length === 50,
  })
}

export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const userId = session.user.id
  const conv = await getConversationForUser(params.conversationId, userId)
  if (!conv) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 })

  const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id

  // Vérifier si l'expéditeur est bloqué par le destinataire
  const blocked = await prisma.block.findFirst({
    where: { blockerId: otherUserId, blockedId: userId },
  })
  if (blocked) return NextResponse.json({ error: "Vous ne pouvez pas envoyer de messages" }, { status: 403 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: "Message vide" }, { status: 400 })

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId: conv.id, senderId: userId, content: content.trim() },
      include: { sender: { select: { id: true, steamName: true, discordName: true, name: true, customAvatar: true, steamAvatar: true, discordAvatar: true, image: true } } },
    }),
    prisma.conversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    }),
    prisma.notification.create({
      data: {
        userId: otherUserId,
        type: "NEW_MESSAGE",
        message: "Vous avez reçu un nouveau message",
        link: `/messages/${conv.id}`,
      },
    }),
  ])

  return NextResponse.json(message, { status: 201 })
}
