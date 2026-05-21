import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const userId = session.user.id

  const [friendRequests, pendingApplications] = await Promise.all([
    prisma.friendship.count({
      where: { receiverId: userId, status: "PENDING" },
    }),
    prisma.application.count({
      where: {
        status: "PENDING",
        community: {
          memberships: {
            some: { userId, role: { in: ["OWNER", "ADMIN"] } },
          },
        },
      },
    }),
  ])

  return NextResponse.json({ friendRequests, pendingApplications })
}
