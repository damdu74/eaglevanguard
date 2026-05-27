import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { CommunitySearch } from "@/components/community/community-search"
import Link from "next/link"
import { Users, Calendar, Plus, Shield, Lock, Globe } from "lucide-react"
import { CommunityLogo } from "@/components/community/community-logo"

export const dynamic = "force-dynamic"
export const metadata = { title: "Annuaire des communautés" }

const PER_PAGE = 12

interface PageProps {
  searchParams: { page?: string; q?: string; game?: string }
}

export default async function CommunitiesPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10))
  const q = searchParams.q?.trim() ?? ""
  const gameFilter = searchParams.game?.trim() ?? ""
  const userId = session?.user?.id as string | undefined

  const where = {
    isPublic: true,
    ...(userId ? { memberships: { none: { userId } } } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    ...(gameFilter ? { game: gameFilter } : {}),
  }

  const [total, communities, allGames] = await Promise.all([
    prisma.community.count({ where }),
    prisma.community.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { memberships: true, events: true } },
      },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.community.findMany({
      where: { isPublic: true },
      select: { game: true },
      distinct: ["game"],
      orderBy: { game: "asc" },
    }).then((rows) => rows.map((r) => r.game)),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Annuaire des communautés</h1>
          <p className="text-sm text-muted-foreground">{total} communauté{total > 1 ? "s" : ""}</p>
        </div>
        {session && (
          <Button asChild disabled={!session.user?.isNexusTeam}>
            <Link href={session.user?.isNexusTeam ? "/communities/new" : "#"}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle communauté
            </Link>
          </Button>
        )}
      </div>

      <CommunitySearch games={allGames} />

      {communities.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-muted-foreground text-center">
          <Shield className="h-12 w-12" />
          <div>
            {q || gameFilter ? (
              <p className="font-medium">Aucune communauté ne correspond à votre recherche.</p>
            ) : (
              <>
                <p className="font-medium">Aucune communauté pour le moment.</p>
                <p className="text-sm">Soyez le premier à en créer une !</p>
              </>
            )}
          </div>
          {session && !q && !gameFilter && (
            <Button asChild>
              <Link href="/communities/new">Créer une communauté</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((community) => {
              const isPrivate = !community.isPublic

              return (
                <Link key={community.id} href={`/communities/${community.slug}`}>
                  <Card className="h-full transition-colors hover:bg-muted/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <CommunityLogo url={community.logoUrl} name={community.name} size="md" />
                          <CardTitle className="text-base leading-tight">{community.name}</CardTitle>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{community.game}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {community.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {community.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {community._count.memberships} membre{community._count.memberships > 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {community._count.events} événement{community._count.events > 1 ? "s" : ""}
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          {isPrivate
                            ? <><Lock className="h-3 w-3" />Privée</>
                            : <><Globe className="h-3 w-3" />Publique</>
                          }
                        </span>
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
