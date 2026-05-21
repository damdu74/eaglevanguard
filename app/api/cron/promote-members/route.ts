import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const result = await prisma.membership.updateMany({
    where: {
      role: "RECRUIT",
      joinedAt: { lte: sevenDaysAgo },
    },
    data: { role: "MEMBER" },
  })

  return NextResponse.json({ promoted: result.count })
}
