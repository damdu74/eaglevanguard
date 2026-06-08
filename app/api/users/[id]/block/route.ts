import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const block = await prisma.block.findFirst({
    where: { blockerId: session.user.id, blockedId: params.id },
  })

  return NextResponse.json({ isBlocked: !!block })
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const userId = session.user.id
  if (params.id === userId) return NextResponse.json({ error: "Action invalide" }, { status: 400 })

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: userId, blockedId: params.id } },
    create: { blockerId: userId, blockedId: params.id },
    update: {},
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  await prisma.block.deleteMany({
    where: { blockerId: session.user.id, blockedId: params.id },
  })

  return NextResponse.json({ ok: true })
}
