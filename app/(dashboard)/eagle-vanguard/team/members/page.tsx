import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EagleVanguardMembersManager } from "@/components/eagle-vanguard/eagle-vanguard-members-manager"
import Link from "next/link"
import { ChevronLeft, Settings } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Membres — Eagle Vanguard Team" }

export default async function EagleVanguardMembersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isEagleVanguardTeam) redirect("/dashboard")

  const [ranks, members] = await Promise.all([
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
  ])

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/eagle-vanguard/team"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Eagle Vanguard Team
        </Link>
        <h1 className="text-2xl font-bold">Membres Eagle Vanguard Team</h1>
        <p className="text-sm text-muted-foreground">Gérez les membres, leurs rôles et fonctions.</p>
      </div>

      <EagleVanguardMembersManager
        initialRanks={ranks}
        initialMembers={members}
        currentUserId={session.user.id}
      />
    </div>
  )
}
