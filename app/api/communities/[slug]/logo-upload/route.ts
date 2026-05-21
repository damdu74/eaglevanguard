import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id as string,
      community: { slug: params.slug },
      role: { in: ["OWNER", "ADMIN"] },
    },
  })
  if (!membership) return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  })
  if (!community) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 })

  const ext = file.name.split(".").pop() ?? "png"
  const blob = await put(`community-logos/${community.id}.${ext}`, file, {
    access: "public",
    allowOverwrite: true,
  })

  await prisma.community.update({
    where: { id: community.id },
    data: { logoUrl: blob.url },
  })

  return NextResponse.json({ url: blob.url })
}
