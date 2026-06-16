import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { bio, visibility, theme, genre } = await req.json()

  const validVisibility = ["PUBLIC", "FRIENDS", "PRIVATE"]
  const validThemes = ["light", "dark", "system"]

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(bio !== undefined && { bio: bio.trim() || null }),
      ...(visibility && validVisibility.includes(visibility) && { visibility }),
      ...(theme && validThemes.includes(theme) && { theme }),
      ...(genre !== undefined && { genre: ["Homme", "Femme", "Autre"].includes(genre) ? genre : null }),
    },
  })

  return NextResponse.json({ ok: true })
}
