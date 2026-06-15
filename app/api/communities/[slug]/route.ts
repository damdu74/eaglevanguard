import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = { params: { slug: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      ranks: { orderBy: { order: "asc" } },
      units: true,
      _count: { select: { memberships: true, events: true } },
    },
  })

  if (!community) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(community)
}
