import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { createAuditLog } from "@/lib/audit"
import { hasCommunityPermission } from "@/lib/permissions"

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  isPinned: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string; postId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  })
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [post, membership] = await Promise.all([
    prisma.communityPost.findFirst({ where: { id: params.postId, communityId: community.id } }),
    prisma.membership.findFirst({
      where: { communityId: community.id, userId: session.user.id as string },
      include: { rank: { select: { permissions: true } } },
    }),
  ])
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const canManage = hasCommunityPermission(membership, "MANAGE_POSTS")
  const isAuthor = post.authorId === (session.user.id as string)
  if (!canManage && !isAuthor) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.communityPost.update({
    where: { id: params.postId },
    data: parsed.data,
    include: {
      author: {
        select: { id: true, steamName: true, discordName: true, name: true, customAvatar: true, steamAvatar: true, discordAvatar: true, image: true },
      },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: Request,
  { params }: { params: { slug: string; postId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  })
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [post, membership] = await Promise.all([
    prisma.communityPost.findFirst({ where: { id: params.postId, communityId: community.id } }),
    prisma.membership.findFirst({
      where: { communityId: community.id, userId: session.user.id as string },
      include: { rank: { select: { permissions: true } } },
    }),
  ])
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const canManage = hasCommunityPermission(membership, "MANAGE_POSTS")
  const isAuthor = post.authorId === (session.user.id as string)
  if (!canManage && !isAuthor) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await createAuditLog({
    action: "POST_DELETED",
    description: `Annonce « ${post.title} » supprimée`,
    actorId: session.user.id as string,
    communityId: community.id,
    metadata: { postId: params.postId, title: post.title },
  })

  await prisma.communityPost.delete({ where: { id: params.postId } })

  return NextResponse.json({ ok: true })
}
