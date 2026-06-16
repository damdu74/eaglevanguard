import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EagleVanguardPlayersManager } from "@/components/eagle-vanguard/eagle-vanguard-players-manager"
import { EagleVanguardNav } from "@/components/eagle-vanguard/eagle-vanguard-nav"

export const dynamic = "force-dynamic"
export const metadata = { title: "Membres — Eagle Vanguard Team" }

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

  const [community, players] = await Promise.all([
    prisma.community.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } }),
    prisma.user.findMany({
      where: { ...searchFilter },
      select: {
        id: true,
        steamName: true,
        discordName: true,
        name: true,
        customAvatar: true,
        steamAvatar: true,
        discordAvatar: true,
        image: true,
        isEagleVanguardTeam: true,
        eagleVanguardRank: { select: { name: true, color: true } },
        memberships: { where: {}, select: { communityId: true }, take: 1 },
        _count: { select: { memberships: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const communityId = community?.id ?? null
  const playersWithMembership = players.map(p => ({
    ...p,
    isMember: communityId ? p.memberships.some(m => m.communityId === communityId) : false,
  }))

  const staff = playersWithMembership.filter(p => p.isEagleVanguardTeam)
  const members = playersWithMembership.filter(p => !p.isEagleVanguardTeam)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Eagle Vanguard Team</h1>
        <p className="text-sm text-muted-foreground">Gestion du staff de la plateforme</p>
      </div>
      <EagleVanguardNav />
      <EagleVanguardPlayersManager
        staff={staff}
        members={members}
        initialQuery={q}
      />
    </div>
  )
}
