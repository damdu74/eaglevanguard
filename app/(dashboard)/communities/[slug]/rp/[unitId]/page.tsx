import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RpUnitDetail } from "@/components/community/rp-unit-detail"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

interface PageProps {
  params: { slug: string; unitId: string }
}

export async function generateMetadata({ params }: PageProps) {
  const unit = await prisma.rpUnit.findUnique({ where: { id: params.unitId } })
  return { title: unit?.name ?? "Unité RP" }
}

export default async function RpUnitPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  if (!community) notFound()

  const membership = session?.user?.id
    ? await prisma.membership.findFirst({
        where: { communityId: community.id, userId: session.user.id as string },
      })
    : null

  if (!community.isPublic && !membership) redirect(`/communities/${params.slug}`)

  const unit = await prisma.rpUnit.findUnique({ where: { id: params.unitId } })
  if (!unit || unit.communityId !== community.id) notFound()

  const isStaff = !!membership && ["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)

  const [characters, groups] = await Promise.all([
    prisma.rpCharacter.findMany({
      where: { rpUnitId: params.unitId },
      include: { user: { select: { id: true, name: true, image: true, customAvatar: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.rpGroup.findMany({
      where: { rpUnitId: params.unitId },
      orderBy: { order: "asc" },
    }),
  ])

  let hasCharacterElsewhere = false
  if (session?.user?.id) {
    const existingChar = await prisma.rpCharacter.findFirst({
      where: { communityId: community.id, userId: session.user.id as string },
    })
    if (existingChar && !existingChar.rpUnitId) {
      // Personnage orphelin (son unité a été supprimée) — on le nettoie
      await prisma.rpCharacter.delete({ where: { id: existingChar.id } })
    } else {
      hasCharacterElsewhere = !!existingChar
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/communities/${params.slug}/rp`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1">
          <ChevronLeft className="h-4 w-4" />
          Registre des effectifs
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold">{unit.name}</h1>
          {unit.era && <Badge variant="outline">{unit.era}</Badge>}
        </div>
        {unit.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{unit.description}</p>
        )}
      </div>

      <RpUnitDetail
        communitySlug={params.slug}
        unitId={unit.id}
        characters={characters}
        groups={groups}
        isStaff={isStaff}
        currentUserId={session?.user?.id ?? null}
        hasCharacterElsewhere={hasCharacterElsewhere}
      />
    </div>
  )
}
