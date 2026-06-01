import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { checkNexusPermission } from "@/lib/nexus-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const ranks = await prisma.nexusRank.findMany({ orderBy: { order: "asc" } })
  return NextResponse.json(ranks)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!await checkNexusPermission(session.user.id, "MANAGE_RANKS")) {
    return NextResponse.json({ error: "Permission MANAGE_RANKS requise" }, { status: 403 })
  }

  const { name, abbreviation, order, color, category } = await req.json()
  if (!name?.trim() || !abbreviation?.trim()) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
  }

  const rank = await prisma.nexusRank.create({
    data: {
      name: name.trim(),
      abbreviation: abbreviation.trim().toUpperCase(),
      order: order ?? 0,
      color: color ?? "#6366f1",
      category: category === "FUNCTION" ? "FUNCTION" : "ROLE",
    },
  })

  await createAuditLog({
    action: "NEXUS_RANK_CREATED",
    description: `Grade NEXUS « ${rank.name} » (${rank.category}) créé`,
    actorId: session.user.id as string,
    metadata: { rankId: rank.id, category: rank.category },
  })

  return NextResponse.json(rank, { status: 201 })
}
