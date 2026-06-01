import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MemberActions } from "@/components/community/member-actions"
import Link from "next/link"
import { ChevronLeft, Crown } from "lucide-react"

export const dynamic = "force-dynamic"

interface PageProps {
  params: { slug: string }
  searchParams?: { back?: string }
}

export async function generateMetadata({ params }: PageProps) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  return { title: community ? `Membres — ${community.name}` : "Membres" }
}

import { hasCommunityPermission, isStaff, ROLE_LABELS } from "@/lib/permissions"

const ROLE_ORDER: Record<string, number> = {
  OWNER: 0,
  MEMBER: 1,
  RECRUIT: 2,
}

export default async function CommunityMembersPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true, isPublic: true, creatorId: true },
  })
  if (!community) notFound()

  const myMembership = session?.user?.id
    ? await prisma.membership.findFirst({
        where: { communityId: community.id, userId: session.user.id as string },
        include: { communityRole: { select: { permissions: true } } },
      })
    : null

  if (!community.isPublic && !myMembership) redirect(`/communities/${params.slug}`)

  const memberships = await prisma.membership.findMany({
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
      rank: { select: { id: true, name: true } },
      communityRole: { select: { name: true, color: true, permissions: true } },
    },
  })

  const [ranks, communityRoles] = await Promise.all([
    prisma.rank.findMany({
      where: { communityId: community.id },
      orderBy: { order: "asc" },
      select: { id: true, name: true, abbreviation: true, isPermanent: true },
    }),
    prisma.communityRole.findMany({
      where: { communityId: community.id },
      orderBy: { order: "asc" },
      select: { id: true, name: true, color: true },
    }),
  ])

  const sorted = [...memberships].sort(
    (a, b) => (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99)
  )

  const staffList = sorted.filter((m) => m.role === "OWNER" || isStaff(m))
  const regular = sorted.filter((m) => m.role !== "OWNER" && !isStaff(m))

  const myRole = myMembership?.role ?? null
  const canManage = myMembership ? isStaff(myMembership) : false

  const membersUrl = `/communities/${params.slug}/members${searchParams?.back ? `?back=${encodeURIComponent(searchParams.back)}` : ""}`

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href={searchParams?.back ?? `/communities/${params.slug}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          {community.name}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Membres</h1>
            <p className="text-sm text-muted-foreground">{community.name}</p>
          </div>
          <span className="text-sm text-muted-foreground">
            {memberships.length} membre{memberships.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Staff */}
      {staffList.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide">Staff</h2>
            <span className="text-xs text-muted-foreground">{staffList.length} membre{staffList.length > 1 ? "s" : ""}</span>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {staffList.map(({ user, role, rank, communityRole, communityRoleId }) => (
                  <MemberRow
                    key={user.id}
                    user={user}
                    role={role}
                    customRoleName={communityRole?.name ?? null}
                    customRoleColor={communityRole?.color ?? null}
                    currentCommunityRoleId={communityRoleId ?? null}
                    rank={rank ?? null}
                    isMe={user.id === session?.user?.id}
                    isCreator={user.id === community.creatorId}
                    canActOnTarget={canManage && user.id !== session?.user?.id && myRole === "OWNER"}
                    communitySlug={params.slug}
                    ranks={ranks}
                    communityRoles={communityRoles}
                    myRole={myRole}
                    membersUrl={membersUrl}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Membres */}
      {regular.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide">Membres</h2>
            <span className="text-xs text-muted-foreground">{regular.length} membre{regular.length > 1 ? "s" : ""}</span>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {regular.map(({ user, role, rank, communityRole, communityRoleId }) => (
                  <MemberRow
                    key={user.id}
                    user={user}
                    role={role}
                    customRoleName={communityRole?.name ?? null}
                    customRoleColor={communityRole?.color ?? null}
                    currentCommunityRoleId={communityRoleId ?? null}
                    rank={rank ?? null}
                    isMe={user.id === session?.user?.id}
                    isCreator={user.id === community.creatorId}
                    canActOnTarget={canManage && user.id !== session?.user?.id}
                    communitySlug={params.slug}
                    ranks={ranks}
                    communityRoles={communityRoles}
                    myRole={myRole}
                    membersUrl={membersUrl}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {hasCommunityPermission(myMembership, "MANAGE_APPLICATIONS") && (
        <div className="flex justify-end">
          <Link
            href={`/communities/${params.slug}/applications`}
            className="text-sm text-primary hover:underline underline-offset-4"
          >
            Gérer les candidatures →
          </Link>
        </div>
      )}
    </div>
  )
}

function MemberRow({
  user, role, customRoleName, customRoleColor, currentCommunityRoleId, rank, isMe, isCreator, canActOnTarget, communitySlug, ranks, communityRoles, myRole, membersUrl,
}: {
  user: { id: string; steamName: string | null; discordName: string | null; name: string | null; customAvatar: string | null; steamAvatar: string | null; discordAvatar: string | null }
  role: string
  customRoleName: string | null
  customRoleColor: string | null
  currentCommunityRoleId: string | null
  rank: { id: string; name: string } | null
  isMe: boolean
  isCreator: boolean
  canActOnTarget: boolean
  communitySlug: string
  ranks: { id: string; name: string; abbreviation: string; isPermanent: boolean }[]
  communityRoles: { id: string; name: string; color: string }[]
  myRole: string | null
  membersUrl: string
}) {
  const displayName = user.steamName ?? user.discordName ?? user.name ?? "Joueur"
  const avatar = user.customAvatar ?? user.steamAvatar ?? user.discordAvatar

  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <Link
        href={isMe ? "/profile" : `/profile/${user.id}?back=${encodeURIComponent(membersUrl)}`}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0"
      >
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={avatar ?? undefined} />
          <AvatarFallback className="text-xs">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-none truncate flex items-center gap-1.5">
            {displayName}
            {isCreator && <Crown className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
          </p>
          {rank && <p className="text-xs text-muted-foreground mt-0.5">{rank.name}</p>}
        </div>
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        <Badge
          variant="outline"
          className="text-xs"
          style={
            isCreator
              ? { backgroundColor: "#5865F2", borderColor: "#5865F2", color: "#fff" }
              : customRoleColor
              ? { backgroundColor: `${customRoleColor}20`, borderColor: customRoleColor, color: customRoleColor }
              : undefined
          }
        >
          {isCreator ? "Fondateur" : customRoleName ?? (ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role)}
        </Badge>
        {canActOnTarget && (
          <MemberActions
            communitySlug={communitySlug}
            userId={user.id}
            currentRole={role}
            currentCommunityRoleId={currentCommunityRoleId}
            currentRankId={rank?.id ?? null}
            ranks={ranks}
            communityRoles={communityRoles}
            myRole={myRole!}
          />
        )}
      </div>
    </div>
  )
}
