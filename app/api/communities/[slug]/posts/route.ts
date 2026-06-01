import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { createAuditLog } from "@/lib/audit"

const createSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  isPinned: z.boolean().optional(),
})

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true, isPublic: true },
  })
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const membership = session?.user?.id
    ? await prisma.membership.findFirst({
        where: { communityId: community.id, userId: session.user.id as string },
      })
    : null

  if (!community.isPublic && !membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const posts = await prisma.communityPost.findMany({
    where: { communityId: community.id },
    include: {
      author: {
        select: { id: true, steamName: true, discordName: true, name: true, customAvatar: true, steamAvatar: true, discordAvatar: true, image: true },
      },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  })

  return NextResponse.json(posts)
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  })
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const membership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId: session.user.id as string },
  })
  if (!membership || !["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const post = await prisma.communityPost.create({
    data: {
      communityId: community.id,
      authorId: session.user.id as string,
      title: parsed.data.title,
      content: parsed.data.content,
      isPinned: parsed.data.isPinned ?? false,
    },
    include: {
      author: {
        select: { id: true, steamName: true, discordName: true, name: true, customAvatar: true, steamAvatar: true, discordAvatar: true, image: true },
      },
    },
  })

  await createAuditLog({
    action: "POST_CREATED",
    description: `Annonce « ${post.title} » publiée`,
    actorId: session.user.id as string,
    communityId: community.id,
    metadata: { postId: post.id, title: post.title },
  })

  return NextResponse.json(post, { status: 201 })
}
