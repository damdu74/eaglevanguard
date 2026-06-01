import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NewEventWithTemplates } from "@/components/events/new-event-with-templates"
import Link from "next/link"
import { ChevronLeft, LayoutTemplate } from "lucide-react"

interface PageProps {
  params: { slug: string }
}

export const metadata = { title: "Créer un événement" }

export default async function NewEventPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true },
  })
  if (!community) notFound()

  const membership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId: session.user.id },
    include: { rank: { select: { permissions: true } } },
  })
  const { hasCommunityPermission } = await import("@/lib/permissions")
  if (!hasCommunityPermission(membership, "MANAGE_EVENTS")) redirect(`/communities/${params.slug}`)

  const templates = await prisma.eventTemplate.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, title: true, type: true, description: true, maxSlots: true },
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/communities/${params.slug}/events`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Événements
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Créer un événement</h1>
            <p className="text-sm text-muted-foreground">{community.name}</p>
          </div>
          <Link
            href={`/communities/${params.slug}/events/templates`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LayoutTemplate className="h-4 w-4" />
            Gérer les templates
          </Link>
        </div>
      </div>

      <NewEventWithTemplates communitySlug={params.slug} templates={templates} />
    </div>
  )
}
