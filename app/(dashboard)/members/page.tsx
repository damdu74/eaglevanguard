import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Users } from "lucide-react"

export const metadata = { title: "Membres" }

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MODERATOR: "Modérateur",
  MEMBER: "Membre",
  RECRUIT: "Recrue",
}

const ROLE_ORDER: Record<string, number> = {
  OWNER: 0,
  ADMIN: 1,
  MODERATOR: 2,
  MEMBER: 3,
  RECRUIT: 4,
}

export default async function MembersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id as string },
    include: {
      community: {
        include: {
          memberships: {
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
              rank: { select: { name: true } },
            },
            orderBy: { role: "asc" },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  })

  if (memberships.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Membres</h1>
        <div className="flex flex-col items-center gap-4 py-24 text-muted-foreground text-center">
          <Users className="h-12 w-12" />
          <div>
            <p className="font-medium">Vous n&apos;êtes membre d&apos;aucune communauté.</p>
            <p className="text-sm">
              <Link href="/communities" className="underline underline-offset-4 hover:text-foreground">
                Rejoignez une communauté
              </Link>{" "}
              pour voir ses membres ici.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Membres</h1>

      {memberships.map(({ community }) => {
        const sorted = [...community.memberships].sort(
          (a, b) => (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99)
        )

        return (
          <section key={community.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <Link
                href={`/communities/${community.slug}`}
                className="flex items-center gap-2 hover:underline underline-offset-4"
              >
                <h2 className="text-lg font-semibold">{community.name}</h2>
              </Link>
              <span className="text-sm text-muted-foreground">
                {community.memberships.length} membre{community.memberships.length > 1 ? "s" : ""}
              </span>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {sorted.map(({ user, role, rank }) => {
                    const displayName = user.steamName ?? user.discordName ?? user.name ?? "Joueur"
                    const avatar = user.customAvatar ?? user.steamAvatar ?? user.discordAvatar
                    const isMe = user.id === session.user.id

                    return (
                      <div key={user.id} className="flex items-center justify-between px-4 py-3">
                        <Link
                          href={isMe ? "/profile" : `/profile/${user.id}`}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={avatar ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {displayName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-none">
                              {displayName}
                              {isMe && (
                                <span className="ml-2 text-xs text-muted-foreground">(vous)</span>
                              )}
                            </p>
                            {rank && (
                              <p className="text-xs text-muted-foreground mt-0.5">{rank.name}</p>
                            )}
                          </div>
                        </Link>
                        <Badge variant="outline" className="text-xs">
                          {ROLE_LABELS[role] ?? role}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </section>
        )
      })}
    </div>
  )
}
