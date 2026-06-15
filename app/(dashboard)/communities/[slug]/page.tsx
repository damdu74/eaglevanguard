import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RichTextContent } from "@/components/ui/rich-text-content"
import { CommunityLogo } from "@/components/community/community-logo"
import Image from "next/image"
import Link from "next/link"
import { Users, ChevronLeft, Megaphone, ShieldAlert, ScrollText, EyeOff } from "lucide-react"

export const dynamic = "force-dynamic"

interface PageProps {
  params: { slug: string }
  searchParams?: { back?: string }
}

export async function generateMetadata({ params }: PageProps) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  return { title: community?.name ?? "Communauté" }
}

export default async function CommunityPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    include: {
      creator: { select: { id: true, name: true } },
      _count: { select: { memberships: true } },
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
  const isStaff = membership && ["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)

  const postsCount = membership
    ? await prisma.communityPost.count({ where: { communityId: community.id } })
    : 0

  const ROLE_LABELS: Record<string, string> = {
    OWNER: "Propriétaire",
    ADMIN: "Administrateur",
    MODERATOR: "Modérateur",
    MEMBER: "Membre",
    RECRUIT: "Nouveau",
  }

  return (
    <div className="space-y-6">
      {searchParams?.back && (
        <Link
          href={searchParams.back}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Link>
      )}

      {/* Bannière */}
      {community.bannerUrl && (
        <div className="w-full h-48 sm:h-64 rounded-xl overflow-hidden relative">
          <Image
            src={community.bannerUrl}
            alt={`Bannière de ${community.name}`}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <CommunityLogo url={community.logoUrl} name={community.name} size="lg" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{community.name}</h1>
              <Badge variant="secondary">{community.game}</Badge>
              {community.visibility === "INVISIBLE" && (
                <Badge variant="outline" className="gap-1"><EyeOff className="h-3 w-3" />Invisible</Badge>
              )}
            </div>
            {community.description && (
              <RichTextContent html={community.description} className="max-w-2xl" />
            )}
            {membership && (
              <p className="text-sm text-muted-foreground">
                {community._count.memberships} membres
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Contenu réservé aux membres */}
      {membership && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                href: `/communities/${params.slug}/members`,
                label: "Membres", icon: Users, count: community._count.memberships, highlight: false,
              },
              { href: `/communities/${params.slug}/news`, label: "Annonces", icon: Megaphone, count: postsCount, highlight: false },
              ...(isStaff ? [{ href: `/communities/${params.slug}/moderation`, label: "Modération", icon: ShieldAlert, count: null, highlight: false }] : []),
              ...(isStaff ? [{ href: `/communities/${params.slug}/logs`, label: "Logs", icon: ScrollText, count: null, highlight: false }] : []),
            ].map(({ href, label, icon: Icon, count, highlight }) => (
              <Link key={href} href={href} className="h-full">
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardContent className="flex h-full items-center justify-center gap-2 py-4">
                    <Icon className={`h-5 w-5 ${highlight ? "text-orange-500" : "text-primary"}`} />
                    {count !== null ? (
                      <>
                        <p className={`text-lg font-bold ${highlight ? "text-orange-500" : ""}`}>{count}</p>
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
            <CardHeader className="pb-2">
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
                <p className="font-medium">{new Date(membership.joinedAt).toLocaleDateString("fr-FR")}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
