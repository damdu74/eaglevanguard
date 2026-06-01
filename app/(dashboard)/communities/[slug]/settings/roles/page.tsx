import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RolesManager } from "@/components/community/roles-manager"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug }, select: { name: true } })
  return { title: community ? `Rôles — ${community.name}` : "Rôles" }
}

export default async function CommunityRolesPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true },
  })
  if (!community) notFound()

  const membership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId: session.user.id as string, role: "OWNER" },
  })
  if (!membership) redirect(`/communities/${params.slug}/settings`)

  const roles = await prisma.communityRole.findMany({
    where: { communityId: community.id },
    include: { _count: { select: { memberships: true } } },
    orderBy: { order: "asc" },
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
        <h1 className="text-2xl font-bold">Rôles personnalisés</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Créez des rôles entre Propriétaire et Membre avec des permissions spécifiques.
        </p>
      </div>
      <RolesManager communitySlug={params.slug} initialRoles={roles} />
    </div>
  )
}
