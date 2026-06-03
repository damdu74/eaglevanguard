import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ColOption = { label: string; icon?: string; abbrev?: string }
type ColEntry  = { key: string; options?: ColOption[] }

function resolveGradeInfo(grade: string | null, columnConfig: unknown) {
  if (!grade || !columnConfig) return { icon: null, abbrev: null }
  const cols = columnConfig as ColEntry[]
  const opt = cols.find((c) => c.key === "grade")?.options?.find((o) => o.label === grade)
  return { icon: opt?.icon ?? null, abbrev: opt?.abbrev ?? null }
}

export async function GET(_req: NextRequest, { params }: { params: { slug: string; unitId: string } }) {
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  })
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const unit = await prisma.rpUnit.findUnique({
    where: { id: params.unitId },
    select: { id: true, communityId: true, columnConfig: true },
  })
  if (!unit || unit.communityId !== community.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  const characters = await prisma.rpCharacter.findMany({
    where: { rpUnitId: params.unitId },
    select: {
      userId: true,
      name: true,
      grade: true,
      user: {
        select: {
          steamName: true,
          discordName: true,
          name: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const members = characters.map((c) => {
    const info = resolveGradeInfo(c.grade, unit.columnConfig)
    return {
      id: c.userId,
      name: c.user.steamName ?? c.user.discordName ?? c.user.name ?? "Inconnu",
      characterName: c.name,
      gradeLabel: c.grade ?? null,
      gradeIcon: info.icon,
      gradeAbbrev: info.abbrev,
    }
  })

  return NextResponse.json({ members })
}
