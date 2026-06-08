import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { conversationId: string; messageId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const userId = session.user.id

  const message = await prisma.message.findFirst({
    where: { id: params.messageId, conversationId: params.conversationId, senderId: userId },
  })
  if (!message) return NextResponse.json({ error: "Message introuvable" }, { status: 404 })

  await prisma.message.delete({ where: { id: message.id } })

  return NextResponse.json({ ok: true })
}
