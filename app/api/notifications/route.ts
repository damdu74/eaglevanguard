import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const userId = session.user.id

  const [friendRequests, pendingApplications, notifications, unreadCount] = await Promise.all([
    prisma.friendship.count({ where: { receiverId: userId, status: "PENDING" } }),
    prisma.application.count({
      where: {
        status: "PENDING",
        community: { memberships: { some: { userId, role: { in: ["OWNER", "ADMIN"] } } } },
      },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ])

  return NextResponse.json({ friendRequests, pendingApplications, notifications, unreadCount })
}

export async function PATCH() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })

  return NextResponse.json({ ok: true })
}
