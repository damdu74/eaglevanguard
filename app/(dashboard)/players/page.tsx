import { prisma } from "@/lib/prisma"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { PlayersSearch } from "@/components/players/players-search"
import Link from "next/link"
import { Users } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Membres" }

interface PageProps {
  searchParams: { q?: string }
}

const userSelect = {
  id: true,
  steamName: true,
  discordName: true,
  name: true,
  customAvatar: true,
  steamAvatar: true,
  discordAvatar: true,
  image: true,
  isEagleVanguardTeam: true,
} as const

function UserCard({ user }: { user: {
  id: string
  steamName: string | null
  discordName: string | null
  name: string | null
  customAvatar: string | null
  steamAvatar: string | null
  discordAvatar: string | null
  image: string | null
  isEagleVanguardTeam: boolean
} }) {
  const displayName = user.steamName ?? user.discordName ?? user.name ?? "Membre"
  const avatar = user.customAvatar ?? user.steamAvatar ?? user.discordAvatar ?? user.image

  return (
    <Link href={`/profile/${user.id}?from=players`}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardContent className="flex items-start gap-3 p-4">
          <Avatar className="h-10 w-10 shrink-0 mt-0.5">
            <AvatarImage src={avatar ?? undefined} />
            <AvatarFallback className="text-sm">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm leading-tight truncate">{displayName}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default async function PlayersPage({ searchParams }: PageProps) {
  const q = searchParams.q?.trim() ?? ""

  const searchFilter = q.length >= 2
    ? {
        OR: [
          { steamName: { contains: q, mode: "insensitive" as const } },
          { discordName: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {}

  const baseWhere = {
    visibility: { not: "PRIVATE" as const },
    ...searchFilter,
  }

  const [staff, members] = await Promise.all([
    prisma.user.findMany({
      where: { ...baseWhere, isEagleVanguardTeam: true },
      select: userSelect,
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { ...baseWhere, isEagleVanguardTeam: false },
      select: userSelect,
      orderBy: { createdAt: "asc" },
    }),
  ])

  const total = staff.length + members.length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Membres</h1>
          <p className="text-sm text-muted-foreground">
            {q.length >= 2
              ? `${total} résultat${total > 1 ? "s" : ""} pour « ${q} »`
              : `${total} membre${total > 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <PlayersSearch initialQuery={q} />

      {total === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground text-center">
          <Users className="h-12 w-12" />
          <p className="font-medium">
            {q.length >= 2 ? "Aucun membre trouvé" : "Aucun membre inscrit"}
          </p>
        </div>
      ) : (
        <>
          {/* Staff */}
          {staff.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Eagle Vanguard Team</h2>
                <span className="text-xs text-muted-foreground">— {staff.length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {staff.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            </div>
          )}

          {/* Membres */}
          {members.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Membres</h2>
                <span className="text-xs text-muted-foreground">— {members.length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
