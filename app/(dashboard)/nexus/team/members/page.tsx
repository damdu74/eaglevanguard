import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NexusMembersManager } from "@/components/nexus/nexus-members-manager"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Membres — NEXUS Team" }

export default async function NexusMembersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isNexusTeam) redirect("/dashboard")

  const [ranks, members] = await Promise.all([
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
      orderBy: [
        { nexusRank: { order: "asc" } },
        { createdAt: "asc" },
      ],
    }),
  ])

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/nexus/team"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          NEXUS Team
        </Link>
        <h1 className="text-2xl font-bold">Membres NEXUS Team</h1>
        <p className="text-sm text-muted-foreground">Gérez les membres, leurs rôles et fonctions.</p>
      </div>

      <NexusMembersManager
        initialRanks={ranks}
        initialMembers={members}
        currentUserId={session.user.id}
      />
    </div>
  )
}
