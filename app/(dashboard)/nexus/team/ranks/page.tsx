import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NexusRanksManager } from "@/components/nexus/nexus-ranks-manager"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "NEXUS Rôles et Fonctions" }

export default async function NexusRanksPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isNexusTeam) redirect("/dashboard")

  const ranks = await prisma.nexusRank.findMany({ orderBy: { order: "asc" } })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/nexus/team"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour à la NEXUS Team
        </Link>
        <h1 className="text-2xl font-bold">NEXUS Rôles et Fonctions</h1>
        <p className="text-sm text-muted-foreground">Hiérarchie interne du staff de la plateforme.</p>
      </div>

      <NexusRanksManager initialRanks={ranks} />
    </div>
  )
}
