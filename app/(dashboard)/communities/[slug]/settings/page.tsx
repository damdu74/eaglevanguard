import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CommunitySettingsForm } from "@/components/community/community-settings-form"
import { CommunityLogoUpload } from "@/components/community/community-logo-upload"
import { DiscordGuildForm } from "@/components/community/discord-guild-form"
import { CommunityVisibilityButton } from "@/components/community/community-visibility-button"
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
    select: { id: true, name: true, slug: true, description: true, game: true, visibility: true, creatorId: true, logoUrl: true, discordGuildId: true },
  })
  if (!community) notFound()

  const membership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId: session.user.id as string },
    include: { rank: { select: { permissions: true } } },
  })
  const { hasCommunityPermission } = await import("@/lib/permissions")
  if (!hasCommunityPermission(membership, "MANAGE_SETTINGS")) redirect(`/communities/${params.slug}`)

  const isOwner = membership?.role === "OWNER"

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/communities/${params.slug}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          {community.name}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Paramètres</h1>
            <p className="text-sm text-muted-foreground">{community.name}</p>
          </div>
          <CommunityVisibilityButton slug={params.slug} initialVisibility={community.visibility} />
        </div>
      </div>

      <CommunityLogoUpload slug={params.slug} currentLogoUrl={community.logoUrl} />

      <DiscordGuildForm slug={params.slug} currentGuildId={community.discordGuildId} discordClientId={process.env.DISCORD_CLIENT_ID ?? null} />

      <CommunitySettingsForm community={community} isOwner={isOwner} />
    </div>
  )
}
