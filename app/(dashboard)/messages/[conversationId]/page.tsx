import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MessageThread } from "@/components/messages/message-thread"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

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

export default async function ConversationPage({ params }: { params: { conversationId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const userId = session.user.id

  const conv = await prisma.conversation.findFirst({
    where: {
      id: params.conversationId,
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: { select: userSelect },
      user2: { select: userSelect },
    },
  })
  if (!conv) notFound()

  const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1

  const messages = await prisma.message.findMany({
    where: { conversationId: conv.id },
    include: { sender: { select: userSelect } },
    orderBy: { createdAt: "asc" },
    take: 50,
  })

  const [isBlocked, isBlockedBy] = await Promise.all([
    prisma.block.findFirst({ where: { blockerId: userId, blockedId: otherUser.id } }),
    prisma.block.findFirst({ where: { blockerId: otherUser.id, blockedId: userId } }),
  ])

  // Marquer comme lu côté serveur au chargement
  await prisma.message.updateMany({
    where: { conversationId: conv.id, senderId: { not: userId }, read: false },
    data: { read: true },
  })

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="mb-4">
        <Link href="/messages" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1">
          <ChevronLeft className="h-4 w-4" />
          Messages
        </Link>
      </div>
      <MessageThread
        conversationId={conv.id}
        currentUserId={userId}
        otherUser={otherUser}
        initialMessages={messages.map((m) => ({
          id: m.id,
          content: m.content,
          read: m.read,
          createdAt: m.createdAt.toISOString(),
          sender: m.sender,
        }))}
        initialIsBlocked={!!isBlocked}
        initialIsBlockedBy={!!isBlockedBy}
      />
    </div>
  )
}
