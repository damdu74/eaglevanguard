import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EagleVanguardRanksManager } from "@/components/eagle-vanguard/eagle-vanguard-ranks-manager"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Eagle Vanguard Rôles et Fonctions" }

export default async function EagleVanguardRanksPage({
  searchParams,
}: {
  searchParams: { from?: string }
}) {
  const CREATOR_STEAM_ID = "76561198059449648"

  const session = await getServerSession(authOptions)
  if (!session?.user?.isEagleVanguardTeam) redirect("/dashboard")

  const [ranks, currentUser] = await Promise.all([
    prisma.eagleVanguardRank.findMany({ orderBy: { order: "asc" } }),
    prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { steamId: true, eagleVanguardRank: { select: { isHidden: true } } },
    }),
  ])

  const isSuperAdmin =
    currentUser?.steamId === CREATOR_STEAM_ID ||
    (currentUser?.eagleVanguardRank?.isHidden ?? false)

  const backHref = `/eagle-vanguard/team/members${searchParams.from ? `?from=${searchParams.from}` : ""}`

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={backHref}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Membres
        </Link>
        <h1 className="text-2xl font-bold">Eagle Vanguard Rôles et Fonctions</h1>
        <p className="text-sm text-muted-foreground">Hiérarchie interne du staff de la plateforme.</p>
      </div>

      <EagleVanguardRanksManager initialRanks={ranks} isSuperAdmin={isSuperAdmin} />
    </div>
  )
}
