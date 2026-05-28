import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  // PUBLISHED → ONGOING : startDate atteinte
  const startedResult = await prisma.event.updateMany({
    where: {
      status: "PUBLISHED",
      startDate: { lte: now },
    },
    data: { status: "ONGOING" },
  })

  // ONGOING → COMPLETED : endDate passée (ou startDate + 8h si pas d'endDate)
  const completedWithEnd = await prisma.event.updateMany({
    where: {
      status: "ONGOING",
      endDate: { lte: now },
    },
    data: { status: "COMPLETED" },
  })

  const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000)
  const completedWithoutEnd = await prisma.event.updateMany({
    where: {
      status: "ONGOING",
      endDate: null,
      startDate: { lte: eightHoursAgo },
    },
    data: { status: "COMPLETED" },
  })

  // COMPLETED → ARCHIVED : updatedAt > 2 jours
  const archivedResult = await prisma.event.updateMany({
    where: {
      status: "COMPLETED",
      updatedAt: { lte: twoDaysAgo },
    },
    data: { status: "ARCHIVED" },
  })

  return NextResponse.json({
    started: startedResult.count,
    completed: completedWithEnd.count + completedWithoutEnd.count,
    archived: archivedResult.count,
  })
}
