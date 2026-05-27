import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const ranks = await prisma.nexusRank.findMany({ orderBy: { order: "asc" } })
  return NextResponse.json(ranks)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isNexusTeam) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

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

  return NextResponse.json(rank, { status: 201 })
}
