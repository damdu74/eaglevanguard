import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EagleVanguardPlayersManager } from "@/components/eagle-vanguard/eagle-vanguard-players-manager"
import { EagleVanguardNav } from "@/components/eagle-vanguard/eagle-vanguard-nav"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Membres — Eagle Vanguard Team" }

interface PageProps {
  searchParams: { q?: string; from?: string }
}

export default async function EagleVanguardPlayersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isEagleVanguardTeam) redirect("/dashboard")

  const q = searchParams.q?.trim() ?? ""
  const fromDashboard = searchParams.from === "dashboard"
  const backHref = fromDashboard ? "/eagle-vanguard/dashboard" : "/eagle-vanguard/team"
  const backLabel = fromDashboard ? "Tableau de bord" : "Equipe"

  const searchFilter = q.length >= 2
    ? {
        OR: [
          { steamName: { contains: q, mode: "insensitive" as const } },
          { discordName: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {}

  const [community, players, pendingApps] = await Promise.all([
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
    prisma.application.findMany({
      where: { status: "PENDING" },
      select: { userId: true },
    }),
  ])

  const communityId = community?.id ?? null
  const pendingUserIds = new Set(pendingApps.map(a => a.userId))
  const playersWithMembership = players.map(p => ({
    ...p,
    isMember: communityId ? p.memberships.some(m => m.communityId === communityId) : false,
    hasPendingApplication: pendingUserIds.has(p.id),
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
