import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RpRoster } from "@/components/community/rp-roster"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  return { title: `Roster RP — ${community?.name ?? "Communauté"}` }
}

export default async function RpPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  if (!community) notFound()

  const membership = session?.user?.id
    ? await prisma.membership.findFirst({
        where: { communityId: community.id, userId: session.user.id as string },
      })
    : null

  if (!community.isPublic && !membership) redirect(`/communities/${params.slug}`)

  const isStaff = !!membership && ["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)

  const units = await prisma.rpUnit.findMany({
    where: { communityId: community.id },
    include: { _count: { select: { characters: true } } },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/communities/${params.slug}`} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Roster RP</h1>
          <p className="text-sm text-muted-foreground">{community.name}</p>
        </div>
      </div>

      <RpRoster
        communitySlug={params.slug}
        units={units}
        isStaff={isStaff}
      />
    </div>
  )
}
