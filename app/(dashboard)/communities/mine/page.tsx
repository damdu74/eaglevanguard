import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, Calendar, Shield, Plus, ImageIcon } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Mes communautés" }

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Fondateur",
  ADMIN: "Administrateur",
  MODERATOR: "Modérateur",
  MEMBER: "Membre",
  RECRUIT: "Nouveau",
}

export default async function MyCommunitiesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id as string },
    include: {
      community: {
        include: {
          _count: { select: { memberships: true, events: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes communautés</h1>
        {session.user.isNexusTeam && (
          <Button asChild size="lg">
            <Link href="/communities/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle communauté
            </Link>
          </Button>
        )}
      </div>

      {memberships.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-muted-foreground text-center">
          <Shield className="h-12 w-12" />
          <div>
            <p className="font-medium">Vous n&apos;avez rejoint aucune communauté.</p>
            <p className="text-sm">
              Parcourez l&apos;{" "}
              <Link href="/communities" className="underline underline-offset-4 hover:text-foreground">
                annuaire des communautés
              </Link>{" "}
              pour en rejoindre une.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map(({ community, role }) => (
            <Link key={community.id} href={`/communities/${community.slug}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded border border-border bg-muted/30 flex items-center justify-center shrink-0 overflow-hidden">
                        {community.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={community.logoUrl}
                            alt={community.name}
                            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </div>
                      <CardTitle className="text-base leading-tight">{community.name}</CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs"
                      style={role === "OWNER" ? { backgroundColor: "#5865F2", borderColor: "#5865F2", color: "#fff" } : undefined}
                    >
                      {ROLE_LABELS[role] ?? role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{community.game}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {community.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {community.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {community._count.memberships} membre{community._count.memberships > 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {community._count.events} événement{community._count.events > 1 ? "s" : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
