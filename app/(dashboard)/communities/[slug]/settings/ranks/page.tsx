import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RanksManager } from "@/components/community/ranks-manager"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  return { title: community ? `Grades communautaires — ${community.name}` : "Grades communautaires" }
}

export default async function RanksPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true },
  })
  if (!community) notFound()

  const membership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId: session.user.id as string },
    include: { rank: { select: { permissions: true } } },
  })
  const { hasCommunityPermission } = await import("@/lib/permissions")
  if (!hasCommunityPermission(membership, "MANAGE_RANKS")) redirect(`/communities/${params.slug}`)

  const ranks = await prisma.rank.findMany({
    where: { communityId: community.id },
    orderBy: [{ isPermanent: "desc" }, { order: "asc" }],
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/communities/${params.slug}/settings`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Paramètres
        </Link>
        <h1 className="text-2xl font-bold">Grades communautaires</h1>
        <p className="text-sm text-muted-foreground">{community.name} — grades de la communauté, distincts des grades en jeu définis dans le roster</p>
      </div>

      <RanksManager communitySlug={params.slug} initialRanks={ranks} />
    </div>
  )
}
