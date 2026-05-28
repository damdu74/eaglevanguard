import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RpRoster } from "@/components/community/rp-roster"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  return { title: `Registre des effectifs — ${community?.name ?? "Communauté"}` }
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

  let canCreate = false
  let existingCharUnit: { id: string; name: string } | null = null
  if (session?.user?.id && membership) {
    const existingChar = await prisma.rpCharacter.findFirst({
      where: { communityId: community.id, userId: session.user.id as string },
      include: { rpUnit: { select: { id: true, name: true } } },
    })
    if (existingChar && !existingChar.rpUnitId) {
      await prisma.rpCharacter.delete({ where: { id: existingChar.id } })
      canCreate = true
    } else if (existingChar) {
      existingCharUnit = existingChar.rpUnit ?? null
    } else {
      canCreate = true
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/communities/${params.slug}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1">
          <ChevronLeft className="h-4 w-4" />
          {community.name}
        </Link>
        <h1 className="text-2xl font-bold">Registre des effectifs</h1>
        <p className="text-sm text-muted-foreground">{community.name}</p>
      </div>

      <RpRoster
        communitySlug={params.slug}
        units={units}
        isStaff={isStaff}
        canCreate={canCreate}
        existingCharUnit={existingCharUnit}
      />
    </div>
  )
}
