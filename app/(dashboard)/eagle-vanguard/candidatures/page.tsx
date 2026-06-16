import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EagleVanguardNav } from "@/components/eagle-vanguard/eagle-vanguard-nav"
import { EagleVanguardCandidaturesManager } from "@/components/eagle-vanguard/eagle-vanguard-candidatures-manager"

export const dynamic = "force-dynamic"
export const metadata = { title: "Candidatures — Eagle Vanguard Team" }

export default async function EagleVanguardCandidaturesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isEagleVanguardTeam) redirect("/dashboard")

  const community = await prisma.community.findFirst({ orderBy: { createdAt: "asc" } })

  const applications = community
    ? await prisma.application.findMany({
        where: { communityId: community.id },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: {
          user: {
            select: {
              id: true,
              steamName: true,
              discordName: true,
              name: true,
              steamAvatar: true,
              discordAvatar: true,
              image: true,
            },
          },
        },
      })
    : []

  const serialized = applications.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: undefined,
  }))

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Eagle Vanguard Team</h1>
        <p className="text-sm text-muted-foreground">Gestion du staff de la plateforme</p>
      </div>
      <EagleVanguardNav />
      <EagleVanguardCandidaturesManager applications={serialized} />
    </div>
  )
}
