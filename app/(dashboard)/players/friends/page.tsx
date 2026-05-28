import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FriendsManager } from "@/components/friends/friends-manager"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Amis" }

export default async function FriendsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const userId = session.user.id as string

  const [acceptedSent, acceptedReceived, pendingReceived] = await Promise.all([
    prisma.friendship.findMany({
      where: { requesterId: userId, status: "ACCEPTED" },
      include: {
        receiver: {
          select: {
            id: true, steamName: true, discordName: true, name: true,
            customAvatar: true, steamAvatar: true, discordAvatar: true, image: true,
          },
        },
      },
    }),
    prisma.friendship.findMany({
      where: { receiverId: userId, status: "ACCEPTED" },
      include: {
        requester: {
          select: {
            id: true, steamName: true, discordName: true, name: true,
            customAvatar: true, steamAvatar: true, discordAvatar: true, image: true,
          },
        },
      },
    }),
    prisma.friendship.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: {
        requester: {
          select: {
            id: true, steamName: true, discordName: true, name: true,
            customAvatar: true, steamAvatar: true, discordAvatar: true, image: true,
          },
        },
      },
    }),
  ])

  const friends = [
    ...acceptedSent.map((f) => ({ friendshipId: f.id, user: f.receiver })),
    ...acceptedReceived.map((f) => ({ friendshipId: f.id, user: f.requester })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/players" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1">
          <ChevronLeft className="h-4 w-4" />
          Retour aux joueurs
        </Link>
        <h1 className="text-2xl font-bold">Amis</h1>
      </div>
      <FriendsManager initialFriends={friends} initialReceived={pendingReceived} />
    </div>
  )
}
