import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EagleVanguardMembersManager } from "@/components/eagle-vanguard/eagle-vanguard-members-manager"
import Link from "next/link"
import { ChevronLeft, Settings } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Membres — Eagle Vanguard Team" }

export default async function EagleVanguardMembersPage({
  searchParams,
}: {
  searchParams: { from?: string }
}) {
  const CREATOR_STEAM_ID = "76561198059449648"

  const session = await getServerSession(authOptions)
  if (!session?.user?.isEagleVanguardTeam) redirect("/dashboard")

  const fromDashboard = searchParams.from === "dashboard"
  const backHref = fromDashboard ? "/eagle-vanguard/dashboard" : "/eagle-vanguard/team"
  const backLabel = fromDashboard ? "Tableau de bord" : "Equipe"

  const [ranks, members, currentUser] = await Promise.all([
    prisma.eagleVanguardRank.findMany({ orderBy: { order: "asc" } }),
    prisma.user.findMany({
      where: { isEagleVanguardTeam: true },
      select: {
        id: true,
        steamName: true,
        discordName: true,
        name: true,
        customAvatar: true,
        steamAvatar: true,
        discordAvatar: true,
        eagleVanguardRankId: true,
        eagleVanguardRank: true,
        eagleVanguardFunctions: true,
      },
      orderBy: [
        { eagleVanguardRank: { order: "asc" } },
        { createdAt: "asc" },
      ],
    }),
    prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { steamId: true, eagleVanguardRank: { select: { isHidden: true } } },
    }),
  ])

  const isSuperAdmin =
    currentUser?.steamId === CREATOR_STEAM_ID ||
    (currentUser?.eagleVanguardRank?.isHidden ?? false)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href={backHref}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Membres Eagle Vanguard Team</h1>
            <p className="text-sm text-muted-foreground">Gérez les membres, leurs rôles et fonctions.</p>
          </div>
          <Link
            href={`/eagle-vanguard/team/ranks?from=${searchParams.from ?? "team"}`}
            className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
            title="Rôles et Fonctions"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      <EagleVanguardMembersManager
        initialRanks={ranks}
        initialMembers={members}
        currentUserId={session.user.id}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  )
}
