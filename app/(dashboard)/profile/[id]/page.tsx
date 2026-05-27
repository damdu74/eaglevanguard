import { getServerSession } from "next-auth"
import { notFound, redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FriendButton } from "@/components/friends/friend-button"
import { Lock, Users, Globe } from "lucide-react"

export const dynamic = "force-dynamic"

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MODERATOR: "Modérateur",
  MEMBER: "Membre",
  RECRUIT: "Nouveau",
}

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  if (params.id === session.user.id) redirect("/profile")

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      memberships: { include: { community: true }, take: 5 },
      nexusRank: true,
    },
  })

  if (!target) notFound()

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: session.user.id, receiverId: params.id },
        { requesterId: params.id, receiverId: session.user.id },
      ],
    },
  })

  const isFriend = friendship?.status === "ACCEPTED"

  if (target.visibility === "PRIVATE") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
        <Lock className="h-12 w-12" />
        <p className="text-lg font-medium">Ce profil est privé.</p>
      </div>
    )
  }

  if (target.visibility === "FRIENDS" && !isFriend) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground max-w-md mx-auto text-center">
        <Users className="h-12 w-12" />
        <p className="text-lg font-medium">Profil réservé aux amis.</p>
        <p className="text-sm">Ajoutez ce joueur pour voir son profil.</p>
        <FriendButton
          targetId={params.id}
          initialStatus={{ type: "none" }}
        />
      </div>
    )
  }

  const displayName = target.steamName ?? target.discordName ?? target.name ?? "Joueur"
  const displayAvatar = target.customAvatar ?? target.steamAvatar ?? target.discordAvatar ?? target.image ?? ""

  type FriendStatus =
    | { type: "none" }
    | { type: "sent"; friendshipId: string }
    | { type: "received"; friendshipId: string }
    | { type: "friends"; friendshipId: string }

  let friendStatus: FriendStatus = { type: "none" }
  if (friendship) {
    if (friendship.status === "ACCEPTED") {
      friendStatus = { type: "friends", friendshipId: friendship.id }
    } else if (friendship.requesterId === session.user.id) {
      friendStatus = { type: "sent", friendshipId: friendship.id }
    } else {
      friendStatus = { type: "received", friendshipId: friendship.id }
    }
  }

  const visibilityLabel = target.visibility === "PUBLIC"
    ? { icon: Globe, label: "Profil public" }
    : { icon: Users, label: "Profil amis" }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{displayName}</h1>
        <FriendButton targetId={params.id} initialStatus={friendStatus} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={displayAvatar} />
              <AvatarFallback className="text-2xl">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xl font-semibold">{displayName}</p>
                {target.isNexusTeam && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded text-white" style={{ backgroundColor: "#5865F2" }}>
                    NEXUS Team
                  </span>
                )}
                {target.nexusRank && (
                  <span
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: target.nexusRank.color }}
                  >
                    {target.nexusRank.name}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Membre depuis le {new Date(target.createdAt).toLocaleDateString("fr-FR")}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <visibilityLabel.icon className="h-3 w-3" />
                {visibilityLabel.label}
              </div>
              {target.bio && (
                <p className="text-sm mt-2 text-foreground">{target.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {target.memberships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Communautés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {target.memberships.map((m) => (
              <div key={m.communityId} className="flex items-center justify-between">
                <p className="font-medium">{m.community.name}</p>
                <Badge variant="outline">{ROLE_LABELS[m.role] ?? m.role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
