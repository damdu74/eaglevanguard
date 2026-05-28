import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NewsManager } from "@/components/community/news-manager"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  return { title: `Annonces — ${community?.name ?? "Communauté"}` }
}

export default async function NewsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, isPublic: true },
  })
  if (!community) notFound()

  const membership = session?.user?.id
    ? await prisma.membership.findFirst({
        where: { communityId: community.id, userId: session.user.id as string },
      })
    : null

  if (!community.isPublic && !membership) redirect(`/communities/${params.slug}`)

  const isStaff = !!membership && ["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)

  const posts = await prisma.communityPost.findMany({
    where: { communityId: community.id },
    include: {
      author: {
        select: {
          id: true,
          steamName: true,
          discordName: true,
          name: true,
          customAvatar: true,
          steamAvatar: true,
          discordAvatar: true,
          image: true,
        },
      },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href={`/communities/${params.slug}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {community.name}
        </Link>
        <h1 className="text-2xl font-bold">Annonces</h1>
        <p className="text-sm text-muted-foreground">{community.name}</p>
      </div>

      <NewsManager
        communitySlug={params.slug}
        initialPosts={posts.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }))}
        isStaff={isStaff}
        currentUserId={session?.user?.id ?? null}
      />
    </div>
  )
}
