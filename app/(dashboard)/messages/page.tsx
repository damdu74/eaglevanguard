import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ConversationList } from "@/components/messages/conversation-list"

export const dynamic = "force-dynamic"
export const metadata = { title: "Messages" }

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

export default async function MessagesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const userId = session.user.id

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { user1Id: userId, deletedByUser1: false },
        { user2Id: userId, deletedByUser2: false },
      ],
    },
    include: {
      user1: { select: userSelect },
      user2: { select: userSelect },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  })

  const otherUserIds = conversations.map((c) => (c.user1Id === userId ? c.user2Id : c.user1Id))

  const [blocksGiven, blocksReceived, unreadGroups] = otherUserIds.length > 0
    ? await Promise.all([
        prisma.block.findMany({ where: { blockerId: userId, blockedId: { in: otherUserIds } } }),
        prisma.block.findMany({ where: { blockedId: userId, blockerId: { in: otherUserIds } } }),
        prisma.message.groupBy({
          by: ["conversationId"],
          where: { conversationId: { in: conversations.map((c) => c.id) }, senderId: { not: userId }, read: false },
          _count: { id: true },
        }),
      ])
    : [[], [], []]

  const blockedSet = new Set(blocksGiven.map((b) => b.blockedId))
  const blockedBySet = new Set(blocksReceived.map((b) => b.blockerId))
  const unreadMap = new Map(unreadGroups.map((g) => [g.conversationId, g._count.id]))

  const initialConversations = conversations.map((conv) => {
    const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1
    return {
      id: conv.id,
      otherUser,
      lastMessage: conv.messages[0]
        ? { ...conv.messages[0], createdAt: conv.messages[0].createdAt.toISOString() }
        : null,
      unreadCount: unreadMap.get(conv.id) ?? 0,
      isBlocked: blockedSet.has(otherUser.id),
      isBlockedBy: blockedBySet.has(otherUser.id),
      updatedAt: conv.updatedAt.toISOString(),
    }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>
      <ConversationList initialConversations={initialConversations} />
    </div>
  )
}
