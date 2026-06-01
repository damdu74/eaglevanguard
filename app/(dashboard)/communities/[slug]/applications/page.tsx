import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ApplicationActions } from "@/components/community/application-actions"
import Link from "next/link"
import { ChevronLeft, Inbox } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  return { title: community ? `Candidatures — ${community.name}` : "Candidatures" }
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
  WITHDRAWN: "Retirée",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "default",
  ACCEPTED: "secondary",
  REJECTED: "destructive",
  WITHDRAWN: "outline",
}

export default async function ApplicationsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true },
  })
  if (!community) notFound()

  const myMembership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId: session.user.id as string },
    include: { rank: { select: { permissions: true } } },
  })
  const { hasCommunityPermission } = await import("@/lib/permissions")
  if (!hasCommunityPermission(myMembership, "MANAGE_APPLICATIONS")) redirect(`/communities/${params.slug}`)

  const applications = await prisma.application.findMany({
    where: { communityId: community.id },
    include: {
      user: {
        select: {
          id: true,
          steamName: true,
          discordName: true,
          name: true,
          customAvatar: true,
          steamAvatar: true,
          discordAvatar: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  })

  const pending = applications.filter((a) => a.status === "PENDING")
  const others = applications.filter((a) => a.status !== "PENDING")

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
            <h1 className="text-2xl font-bold">Candidatures</h1>
            <p className="text-sm text-muted-foreground">{community.name}</p>
          </div>
          {pending.length > 0 && (
            <Badge>{pending.length} en attente</Badge>
          )}
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground text-center">
          <Inbox className="h-10 w-10" />
          <p className="font-medium">Aucune candidature</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                En attente
              </h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {pending.map((app) => (
                      <ApplicationRow
                        key={app.id}
                        app={app}
                        communitySlug={params.slug}
                        showActions
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {others.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Historique
              </h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {others.map((app) => (
                      <ApplicationRow
                        key={app.id}
                        app={app}
                        communitySlug={params.slug}
                        showActions={false}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function ApplicationRow({
  app,
  communitySlug,
  showActions,
}: {
  app: {
    id: string
    status: string
    message: string | null
    response: string | null
    createdAt: Date
    updatedAt: Date
    user: {
      id: string
      steamName: string | null
      discordName: string | null
      name: string | null
      customAvatar: string | null
      steamAvatar: string | null
      discordAvatar: string | null
    }
  }
  communitySlug: string
  showActions: boolean
}) {
  const { user, status, message, response, updatedAt } = app
  const displayName = user.steamName ?? user.discordName ?? user.name ?? "Joueur"
  const avatar = user.customAvatar ?? user.steamAvatar ?? user.discordAvatar

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/profile/${user.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={avatar ?? undefined} />
            <AvatarFallback className="text-xs">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: fr })}
            </p>
          </div>
        </Link>
        <Badge variant={STATUS_VARIANTS[status] ?? "outline"} className="shrink-0 text-xs">
          {STATUS_LABELS[status] ?? status}
        </Badge>
      </div>

      {message && (
        <p className="text-sm text-muted-foreground pl-12 line-clamp-3">{message}</p>
      )}

      {response && status === "REJECTED" && (
        <div className="pl-12">
          <p className="text-xs text-muted-foreground mb-0.5">Raison du refus</p>
          <p className="text-sm text-red-600">{response}</p>
        </div>
      )}

      {showActions && (
        <div className="pl-12">
          <ApplicationActions applicationId={app.id} communitySlug={communitySlug} />
        </div>
      )}
    </div>
  )
}
