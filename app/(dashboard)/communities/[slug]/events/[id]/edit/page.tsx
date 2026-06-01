import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EventForm } from "@/components/events/event-form"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface PageProps {
  params: { slug: string; id: string }
}

export const metadata = { title: "Modifier l'événement" }

export default async function EditEventPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const event = await prisma.event.findFirst({
    where: { id: params.id, community: { slug: params.slug } },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      status: true,
      startDate: true,
      endDate: true,
      maxSlots: true,
      communityId: true,
    },
  })
  if (!event) notFound()

  const membership = await prisma.membership.findFirst({
    where: { communityId: event.communityId, userId: session.user.id },
    include: { rank: { select: { permissions: true } } },
  })
  const { hasCommunityPermission } = await import("@/lib/permissions")
  if (!hasCommunityPermission(membership, "MANAGE_EVENTS")) redirect(`/communities/${params.slug}/events/${params.id}`)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/communities/${params.slug}/events/${params.id}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          {event.title}
        </Link>
        <h1 className="text-2xl font-bold">Modifier l&apos;événement</h1>
        <p className="text-sm text-muted-foreground">{event.title}</p>
      </div>

      <EventForm
        communitySlug={params.slug}
        event={{
          id: event.id,
          title: event.title,
          description: event.description,
          type: event.type,
          status: event.status,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate?.toISOString() ?? null,
          maxSlots: event.maxSlots,
        }}
      />
    </div>
  )
}
