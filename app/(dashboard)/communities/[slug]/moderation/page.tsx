import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MemberRole } from "@prisma/client"
import { ModerationPanel } from "@/components/moderation/moderation-panel"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug }, select: { name: true } })
  return { title: community ? `Modération — ${community.name}` : "Modération" }
}

const STAFF_ROLES: MemberRole[] = ["OWNER", "ADMIN", "MODERATOR"]

export default async function CommunityModerationPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true },
  })
  if (!community) notFound()

  const [membership, nexusUser] = await Promise.all([
    prisma.membership.findFirst({
      where: { userId: session.user.id, communityId: community.id, role: { in: STAFF_ROLES } },
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { isNexusTeam: true } }),
  ])

  if (!membership && !nexusUser?.isNexusTeam) redirect(`/communities/${params.slug}`)

  return (
    <div className="space-y-4">
      <Link
        href={`/communities/${community.slug}`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {community.name}
      </Link>
      <ModerationPanel
        mode="community"
        communitySlug={community.slug}
        communityName={community.name}
        isNexusTeam={nexusUser?.isNexusTeam ?? false}
      />
    </div>
  )
}
