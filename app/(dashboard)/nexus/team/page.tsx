import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NexusTeamManager } from "@/components/nexus/nexus-team-manager"

export const dynamic = "force-dynamic"
export const metadata = { title: "NEXUS Team" }

export default async function NexusTeamPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isNexusTeam) redirect("/dashboard")

  const [ranks, members, totalUsers, totalCommunities, pendingApplications] = await Promise.all([
    prisma.nexusRank.findMany({ orderBy: { order: "asc" } }),
    prisma.user.findMany({
      where: { isNexusTeam: true },
      select: {
        id: true,
        steamName: true,
        discordName: true,
        name: true,
        customAvatar: true,
        steamAvatar: true,
        discordAvatar: true,
        nexusRankId: true,
        nexusRank: true,
        nexusFunctions: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.count(),
    prisma.community.count(),
    prisma.application.count({ where: { status: "PENDING" } }),
  ])

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">NEXUS Team</h1>
        <p className="text-sm text-muted-foreground">Gestion du staff de la plateforme</p>
      </div>
      <NexusTeamManager
        initialRanks={ranks}
        initialMembers={members}
        stats={{ totalUsers, totalCommunities, pendingApplications, teamSize: members.length }}
        currentUserId={session.user.id}
      />
    </div>
  )
}
