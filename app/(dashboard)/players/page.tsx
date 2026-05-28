import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PlayersSearch } from "@/components/players/players-search"
import { PaginationBar } from "@/components/ui/pagination-bar"
import Link from "next/link"
import { Users } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Joueurs" }

const PER_PAGE = 24

interface PageProps {
  searchParams: { q?: string; page?: string }
}

export default async function PlayersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  const q = searchParams.q?.trim() ?? ""
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10))

  const myMemberCommunityIds = session?.user?.id
    ? await prisma.membership
        .findMany({ where: { userId: session.user.id as string }, select: { communityId: true } })
        .then((ms) => new Set(ms.map((m) => m.communityId)))
    : new Set<string>()

  const where = {
    visibility: { not: "PRIVATE" as const },
    ...(session?.user?.id ? { id: { not: session.user.id as string } } : {}),
    ...(q.length >= 2
      ? {
          OR: [
            { steamName: { contains: q, mode: "insensitive" as const } },
            { discordName: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        steamName: true,
        discordName: true,
        name: true,
        customAvatar: true,
        steamAvatar: true,
        discordAvatar: true,
        image: true,
        isNexusTeam: true,
        bio: true,
        memberships: {
          select: {
            community: {
              select: { id: true, name: true, slug: true, isPublic: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Joueurs</h1>
          <p className="text-sm text-muted-foreground">
            {q.length >= 2
              ? `${total} résultat${total > 1 ? "s" : ""} pour « ${q} »`
              : `${total} joueur${total > 1 ? "s" : ""} inscrit${total > 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <PlayersSearch initialQuery={q} />

      {users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground text-center">
          <Users className="h-12 w-12" />
          <p className="font-medium">
            {q.length >= 2 ? "Aucun joueur trouvé" : "Aucun joueur inscrit"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => {
              const displayName = user.steamName ?? user.discordName ?? user.name ?? "Joueur"
              const avatar = user.customAvatar ?? user.steamAvatar ?? user.discordAvatar ?? user.image

              const visibleCommunities = user.memberships
                .map((m) => m.community)
                .filter((c) => c.isPublic || myMemberCommunityIds.has(c.id))

              return (
                <Link key={user.id} href={`/profile/${user.id}?from=players`}>
                  <Card className="h-full transition-colors hover:bg-muted/50">
                    <CardContent className="flex items-start gap-3 p-4">
                      <Avatar className="h-10 w-10 shrink-0 mt-0.5">
                        <AvatarImage src={avatar ?? undefined} />
                        <AvatarFallback className="text-sm">
                          {displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm leading-tight truncate">{displayName}</p>
                          {user.isNexusTeam && (
                            <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none text-white" style={{ backgroundColor: "#5865F2", borderColor: "#5865F2" }}>
                              NEXUS Team
                            </span>
                          )}
                        </div>
                        {user.bio && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {user.bio}
                          </p>
                        )}
                        {visibleCommunities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {visibleCommunities.slice(0, 3).map((c) => (
                              <Badge key={c.id} variant="secondary" className="text-xs px-1.5 py-0">
                                {c.name}
                              </Badge>
                            ))}
                            {visibleCommunities.length > 3 && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                +{visibleCommunities.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          <PaginationBar page={page} total={total} perPage={PER_PAGE} />
        </>
      )}
    </div>
  )
}
