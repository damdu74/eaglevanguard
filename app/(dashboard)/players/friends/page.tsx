import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FriendsPanel } from "@/components/friends/friends-panel"
import { UserSearch } from "@/components/friends/user-search"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Amis</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ma liste d&apos;amis</CardTitle>
          <CardDescription>Gérez vos amis et les demandes reçues.</CardDescription>
        </CardHeader>
        <CardContent>
          <FriendsPanel friends={friends} received={pendingReceived} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter un ami</CardTitle>
          <CardDescription>Recherchez un joueur par son pseudo.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserSearch />
        </CardContent>
      </Card>
    </div>
  )
}
