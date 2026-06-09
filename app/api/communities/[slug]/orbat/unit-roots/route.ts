import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  })
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const roots = await prisma.rpUnitOrbatNode.findMany({
    where: { rpUnit: { communityId: community.id }, nodeId: "root" },
    select: { rpUnitId: true, label: true, data: true },
  })

  const unitRootData: Record<string, Record<string, unknown>> = {}
  for (const root of roots) {
    unitRootData[root.rpUnitId] = {
      ...((root.data as Record<string, unknown>) ?? {}),
      label: root.label,
    }
  }

  return NextResponse.json({ unitRootData })
}
