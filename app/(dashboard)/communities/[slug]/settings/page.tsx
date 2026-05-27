import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CommunitySettingsForm } from "@/components/community/community-settings-form"
import { CommunityLogoUpload } from "@/components/community/community-logo-upload"
import { TransferOwnershipForm } from "@/components/community/transfer-ownership-form"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  return { title: community ? `Paramètres — ${community.name}` : "Paramètres" }
}

export default async function CommunitySettingsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true, description: true, game: true, isPublic: true, creatorId: true, logoUrl: true },
  })
  if (!community) notFound()

  const membership = await prisma.membership.findFirst({
    where: {
      communityId: community.id,
      userId: session.user.id as string,
      role: { in: ["OWNER", "ADMIN"] },
    },
  })
  if (!membership) redirect(`/communities/${params.slug}`)

  const isOwner = membership.role === "OWNER"

  const otherMembers = isOwner
    ? await prisma.membership.findMany({
        where: { communityId: community.id, userId: { not: session.user.id as string } },
        include: {
          user: {
            select: { id: true, steamName: true, discordName: true, name: true, customAvatar: true, steamAvatar: true, discordAvatar: true },
          },
        },
        orderBy: { user: { name: "asc" } },
      })
    : []

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/communities/${params.slug}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour à la communauté
        </Link>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">{community.name}</p>
      </div>

      <CommunityLogoUpload slug={params.slug} currentLogoUrl={community.logoUrl} />

      <CommunitySettingsForm
        community={community}
        isOwner={isOwner}
      />

      {isOwner && (
        <TransferOwnershipForm
          slug={params.slug}
          members={otherMembers.map((m) => ({
            id: m.user.id,
            name: m.user.steamName ?? m.user.discordName ?? m.user.name ?? "Inconnu",
            image: m.user.customAvatar ?? m.user.steamAvatar ?? m.user.discordAvatar ?? null,
          }))}
        />
      )}
    </div>
  )
}
