import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const userId = session.user.id
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        try {
          const [notifications, unreadCount, friendRequests, staffMemberships] = await Promise.all([
            prisma.notification.findMany({
              where: { userId },
              orderBy: { createdAt: "desc" },
              take: 5,
            }),
            prisma.notification.count({ where: { userId, read: false } }),
            prisma.friendship.count({ where: { receiverId: userId, status: "PENDING" } }),
            prisma.membership.findMany({
              where: {
                userId,
                OR: [
                  { role: "OWNER" },
                  { rank: { permissions: { has: "MANAGE_APPLICATIONS" } } },
                ],
              },
              select: { communityId: true },
            }),
          ])

          const pendingApplications =
            staffMemberships.length > 0
              ? await prisma.application.count({
                  where: {
                    communityId: { in: staffMemberships.map((m) => m.communityId) },
                    status: "PENDING",
                  },
                })
              : 0

          const payload = JSON.stringify({
            notifications,
            unreadCount,
            friendRequests,
            pendingApplications,
          })
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
        } catch {
          controller.enqueue(encoder.encode(": heartbeat\n\n"))
        }
      }

      await send()
      const interval = setInterval(send, 8000)

      req.signal.addEventListener("abort", () => {
        clearInterval(interval)
        try {
          controller.close()
        } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
