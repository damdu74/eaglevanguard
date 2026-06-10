import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EagleVanguardTeamManager } from "@/components/eagle-vanguard/eagle-vanguard-team-manager"
import { Eagle VanguardNav } from "@/components/eagle-vanguard/eagle-vanguard-nav"

export const dynamic = "force-dynamic"
export const metadata = { title: "Eagle Vanguard Team" }

export default async function EagleVanguardTeamPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isEagleVanguardTeam) redirect("/dashboard")

  const [totalUsers, totalCommunities, pendingApplications, teamSize] = await Promise.all([
    prisma.user.count(),
    prisma.community.count(),
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { isEagleVanguardTeam: true } }),
  ])

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Eagle Vanguard Team</h1>
        <p className="text-sm text-muted-foreground">Gestion du staff de la plateforme</p>
      </div>
      <Eagle VanguardNav />
      <EagleVanguardTeamManager
        stats={{ totalUsers, totalCommunities, pendingApplications, teamSize }}
      />
    </div>
  )
}
