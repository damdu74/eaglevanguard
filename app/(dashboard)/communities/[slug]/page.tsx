import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RichTextContent } from "@/components/ui/rich-text-content"
import { CommunityLogo } from "@/components/community/community-logo"
import Link from "next/link"
import { Users, Calendar, GitBranch, Settings, Sword } from "lucide-react"

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  return { title: community?.name ?? "Communauté" }
}

export default async function CommunityPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    include: {
      creator: { select: { id: true, name: true } },
      _count: { select: { memberships: true, events: true } },
    },
  })

  if (!community) notFound()

  const membership = session?.user?.id
    ? await prisma.membership.findFirst({
        where: { communityId: community.id, userId: session.user.id as string },
        include: { rank: true },
      })
    : null
  const isAdmin = membership && ["OWNER", "ADMIN"].includes(membership.role)

  const ROLE_LABELS: Record<string, string> = {
    OWNER: "Propriétaire",
    ADMIN: "Administrateur",
    MODERATOR: "Modérateur",
    MEMBER: "Membre",
    RECRUIT: "Nouveau",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <CommunityLogo url={community.logoUrl} name={community.name} size="lg" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{community.name}</h1>
              <Badge variant="secondary">{community.game}</Badge>
              {!community.isPublic && <Badge variant="outline">Privée</Badge>}
            </div>
            {community.description && (
              <RichTextContent html={community.description} className="max-w-2xl" />
            )}
            {membership && (
              <p className="text-sm text-muted-foreground">
                {community._count.memberships} membres · {community._count.events} événements
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {!membership && (
            <Button asChild>
              <Link href={`/communities/${params.slug}/apply`}>Candidater</Link>
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" size="icon" asChild>
              <Link href={`/communities/${params.slug}/settings`}>
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Contenu réservé aux membres */}
      {membership && (
        <>
          <div className={`grid gap-4 ${session?.user?.isNexusTeam ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
            {[
              { href: "members", label: "Membres", icon: Users, count: community._count.memberships },
              { href: "events", label: "Événements", icon: Calendar, count: community._count.events },
              ...(session?.user?.isNexusTeam ? [{ href: "orbat", label: "ORBAT", icon: GitBranch, count: null }] : []),
              { href: "rp", label: "Registre des effectifs", icon: Sword, count: null },
            ].map(({ href, label, icon: Icon, count }) => (
              <Link key={href} href={`/communities/${params.slug}/${href}`} className="h-full">
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardContent className="flex h-full items-center justify-center gap-2 py-4">
                    <Icon className="h-5 w-5 text-primary" />
                    {count !== null ? (
                      <>
                        <p className="text-lg font-bold">{count}</p>
                        <p className="font-medium">{label}</p>
                      </>
                    ) : (
                      <p className="font-medium">{label}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Mon statut</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Rôle</p>
                <p className="font-medium">{ROLE_LABELS[membership.role] ?? membership.role}</p>
              </div>
              {membership.rank && (
                <div>
                  <p className="text-muted-foreground">Grade</p>
                  <p className="font-medium">{membership.rank.name}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Membre depuis</p>
                <p className="font-medium">
                  {new Date(membership.joinedAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
