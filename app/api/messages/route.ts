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

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const userId = session.user.id

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    include: {
      user1: { select: userSelect },
      user2: { select: userSelect },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  })

  if (conversations.length === 0) return NextResponse.json([])

  const otherUserIds = conversations.map((c) => (c.user1Id === userId ? c.user2Id : c.user1Id))

  const [blocksGiven, blocksReceived, unreadGroups] = await Promise.all([
    prisma.block.findMany({ where: { blockerId: userId, blockedId: { in: otherUserIds } } }),
    prisma.block.findMany({ where: { blockedId: userId, blockerId: { in: otherUserIds } } }),
    prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: conversations.map((c) => c.id) },
        senderId: { not: userId },
        read: false,
      },
      _count: { id: true },
    }),
  ])

  const blockedSet = new Set(blocksGiven.map((b) => b.blockedId))
  const blockedBySet = new Set(blocksReceived.map((b) => b.blockerId))
  const unreadMap = new Map(unreadGroups.map((g) => [g.conversationId, g._count.id]))

  const result = conversations.map((conv) => {
    const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1
    return {
      id: conv.id,
      otherUser,
      lastMessage: conv.messages[0] ?? null,
      unreadCount: unreadMap.get(conv.id) ?? 0,
      isBlocked: blockedSet.has(otherUser.id),
      isBlockedBy: blockedBySet.has(otherUser.id),
      updatedAt: conv.updatedAt,
    }
  })

  return NextResponse.json(result)
}

// Crée ou retrouve une conversation avec un autre utilisateur
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const userId = session.user.id
  const { userId: targetId } = await req.json()

  if (!targetId || targetId === userId) {
    return NextResponse.json({ error: "Utilisateur invalide" }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } })
  if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })

  // Enforce ordering: smaller id = user1
  const [user1Id, user2Id] = [userId, targetId].sort()

  const conversation = await prisma.conversation.upsert({
    where: { user1Id_user2Id: { user1Id, user2Id } },
    create: { user1Id, user2Id },
    update: {},
    select: { id: true },
  })

  return NextResponse.json({ conversationId: conversation.id })
}
