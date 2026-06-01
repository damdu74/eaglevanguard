import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NexusTeamManager } from "@/components/nexus/nexus-team-manager"
import { NexusNav } from "@/components/nexus/nexus-nav"

export const dynamic = "force-dynamic"
export const metadata = { title: "NEXUS Team" }

export default async function NexusTeamPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isNexusTeam) redirect("/dashboard")

  const [totalUsers, totalCommunities, pendingApplications, teamSize] = await Promise.all([
    prisma.user.count(),
    prisma.community.count(),
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { isNexusTeam: true } }),
  ])

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">NEXUS Team</h1>
        <p className="text-sm text-muted-foreground">Gestion du staff de la plateforme</p>
      </div>
      <NexusNav />
      <NexusTeamManager
        stats={{ totalUsers, totalCommunities, pendingApplications, teamSize }}
      />
    </div>
  )
}
