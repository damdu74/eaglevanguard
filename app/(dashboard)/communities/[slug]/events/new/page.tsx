import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EventForm } from "@/components/events/event-form"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

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
    where: {
      communityId: community.id,
      userId: session.user.id,
      role: { in: ["OWNER", "ADMIN", "MODERATOR"] },
    },
  })
  if (!membership) redirect(`/communities/${params.slug}`)

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
        <h1 className="text-2xl font-bold">Créer un événement</h1>
        <p className="text-sm text-muted-foreground">{community.name}</p>
      </div>

      <EventForm communitySlug={params.slug} />
    </div>
  )
}
