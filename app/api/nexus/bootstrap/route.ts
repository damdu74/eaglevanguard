import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Endpoint à usage unique — à supprimer après utilisation
// Sécurisé : ne fonctionne que s'il n'existe aucun membre NEXUS Team en base
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const existingCount = await prisma.user.count({ where: { isNexusTeam: true } })
  if (existingCount > 0) return NextResponse.json({ error: "Déjà bootstrappé — supprimez ce fichier" }, { status: 403 })

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { isNexusTeam: true },
    select: { id: true, name: true, steamName: true, isNexusTeam: true },
  })

  return NextResponse.json({ ok: true, user })
}
