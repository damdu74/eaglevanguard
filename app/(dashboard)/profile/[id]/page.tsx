import { getServerSession } from "next-auth"
import { notFound, redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FriendButton } from "@/components/friends/friend-button"
import { CommunityLogo } from "@/components/community/community-logo"
import Link from "next/link"
import { Lock, Users, Globe, Calendar, ChevronLeft } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = "force-dynamic"

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MODERATOR: "Modérateur",
  MEMBER: "Membre",
  RECRUIT: "Nouveau",
}

export default async function PublicProfilePage({ params, searchParams }: { params: { id: string }, searchParams?: { from?: string; back?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  if (params.id === session.user.id) redirect("/profile")

  const [target, friendship, viewerCommunityIds] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.id },
      include: {
        memberships: {
          include: { community: { select: { id: true, name: true, slug: true, logoUrl: true, isPublic: true } } },
          orderBy: { joinedAt: "asc" },
        },
        nexusRank: true,
        events: {
          where: {
            status: { in: ["CONFIRMED", "TENTATIVE"] },
            event: {
              startDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
              status: { in: ["PUBLISHED", "ONGOING", "COMPLETED"] },
            },
          },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                status: true,
                community: { select: { name: true, slug: true } },
              },
            },
          },
          orderBy: { event: { startDate: "desc" } },
          take: 5,
        },
      },
    }),
    prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, receiverId: params.id },
          { requesterId: params.id, receiverId: session.user.id },
        ],
      },
    }),
    prisma.membership.findMany({
      where: { userId: session.user.id },
      select: { communityId: true },
    }).then(ms => new Set(ms.map(m => m.communityId))),
  ])

  if (!target) notFound()

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

  const visibleCommunities = target.memberships.filter(m => m.community.isPublic || viewerCommunityIds.has(m.communityId))
  const sharedCommunities = visibleCommunities.filter(m => viewerCommunityIds.has(m.communityId))
  const otherCommunities = visibleCommunities.filter(m => !viewerCommunityIds.has(m.communityId))

  const recentEvents = target.events.filter(p =>
    p.event.status !== "DRAFT" && p.status !== "DECLINED"
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={
            searchParams?.back ? searchParams.back :
            searchParams?.from === "members" ? "/members" :
            searchParams?.from === "friends" ? "/players/friends" :
            "/players"
          }
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {
            searchParams?.back?.includes("/communities/") ? "Membres" :
            searchParams?.from === "members" ? "Mes membres" :
            searchParams?.from === "friends" ? "Mes amis" :
            "Annuaire des joueurs"
          }
        </Link>
      </div>
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

      {/* Communautés en commun */}
      {sharedCommunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Communautés en commun
              <Badge variant="secondary">{sharedCommunities.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sharedCommunities.map((m) => {
              const profileUrl = `/profile/${params.id}${searchParams?.from ? `?from=${searchParams.from}` : ""}`
              return (
              <Link key={m.communityId} href={`/communities/${m.community.slug}?back=${encodeURIComponent(profileUrl)}`} className="flex items-center justify-between rounded-md px-1 py-0.5 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <CommunityLogo url={m.community.logoUrl} name={m.community.name} size="sm" />
                  <p className="font-medium text-sm truncate">{m.community.name}</p>
                </div>
                <Badge variant="outline">{ROLE_LABELS[m.role] ?? m.role}</Badge>
              </Link>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Autres communautés publiques */}
      {otherCommunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Communautés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {otherCommunities.map((m) => (
              <div key={m.communityId} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <CommunityLogo url={m.community.logoUrl} name={m.community.name} size="sm" />
                  <p className="font-medium text-sm truncate">{m.community.name}</p>
                </div>
                <Badge variant="outline">{ROLE_LABELS[m.role] ?? m.role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Événements récents */}
      {recentEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Opérations récentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentEvents.map((p) => (
              <div key={p.event.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.event.community.name} · {formatDistanceToNow(new Date(p.event.startDate), { addSuffix: true, locale: fr })}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 text-xs"
                >
                  {p.status === "CONFIRMED" ? "Confirmé" : "Intéressé"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
