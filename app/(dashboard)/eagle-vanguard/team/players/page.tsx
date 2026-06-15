import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EagleVanguardPlayersManager } from "@/components/eagle-vanguard/eagle-vanguard-players-manager"
import { EagleVanguardNav } from "@/components/eagle-vanguard/eagle-vanguard-nav"

export const dynamic = "force-dynamic"
export const metadata = { title: "Joueurs — Eagle Vanguard Team" }

interface PageProps {
  searchParams: { q?: string }
}

export default async function EagleVanguardPlayersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isEagleVanguardTeam) redirect("/dashboard")

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

  const players = await prisma.user.findMany({
    where: { isEagleVanguardTeam: false, ...searchFilter },
    select: {
      id: true,
      steamName: true,
      discordName: true,
      name: true,
      customAvatar: true,
      steamAvatar: true,
      discordAvatar: true,
      image: true,
      _count: { select: { memberships: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Eagle Vanguard Team</h1>
        <p className="text-sm text-muted-foreground">Gestion du staff de la plateforme</p>
      </div>
      <EagleVanguardNav />
      <EagleVanguardPlayersManager
        players={players}
        total={players.length}
        initialQuery={q}
      />
    </div>
  )
}
