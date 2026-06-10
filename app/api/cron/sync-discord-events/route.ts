import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { EventStatus } from "@prisma/client"

export const dynamic = "force-dynamic"

// Mapping statut Discord → statut Eagle Vanguard
// Discord: 1=SCHEDULED, 2=ACTIVE, 3=COMPLETED, 4=CANCELLED
function discordStatusToEagleVanguard(status: number): EventStatus {
  if (status === 2) return EventStatus.ONGOING
  if (status === 3) return EventStatus.COMPLETED
  if (status === 4) return EventStatus.CANCELLED
  return EventStatus.PUBLISHED
}

// Mapping entity_type Discord → type Eagle Vanguard
// Discord: 1=STAGE_INSTANCE, 2=VOICE, 3=EXTERNAL
function discordEntityTypeToEagleVanguard(entityType: number): string {
  if (entityType === 1) return "Stage"
  if (entityType === 2) return "Vocal"
  return "Événement"
}

interface DiscordScheduledEvent {
  id: string
  name: string
  description?: string | null
  scheduled_start_time: string
  scheduled_end_time?: string | null
  status: number
  entity_type: number
}

async function fetchDiscordEvents(guildId: string): Promise<DiscordScheduledEvent[]> {
  const token = process.env.DISCORD_BOT_TOKEN
  if (!token) return []

  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/scheduled-events`, {
    headers: { Authorization: `Bot ${token}` },
    next: { revalidate: 0 },
  })

  if (!res.ok) return []
  return res.json()
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const communities = await prisma.community.findMany({
    where: { discordGuildId: { not: null } },
    select: { id: true, discordGuildId: true },
  })

  let created = 0
  let updated = 0
  let cancelled = 0

  for (const community of communities) {
    const guildId = community.discordGuildId!
    const discordEvents = await fetchDiscordEvents(guildId)

    if (!discordEvents.length && discordEvents !== null) {
      // Guild inaccessible — skip sans annuler les événements existants
      continue
    }

    const discordIds = discordEvents.map((e) => e.id)

    // Événements Eagle Vanguard issus de Discord pour cette communauté
    const existingEvents = await prisma.event.findMany({
      where: { communityId: community.id, source: "DISCORD" },
      select: { id: true, discordEventId: true, status: true },
    })

    const existingMap = new Map(existingEvents.map((e) => [e.discordEventId!, e]))

    // Créer ou mettre à jour chaque événement Discord
    for (const de of discordEvents) {
      const eagleVanguardStatus = discordStatusToEagleVanguard(de.status)
      const existing = existingMap.get(de.id)

      if (existing) {
        // Ne pas réécrire si déjà archivé
        if (existing.status === "ARCHIVED") continue
        await prisma.event.update({
          where: { id: existing.id },
          data: {
            title: de.name,
            description: de.description ?? null,
            startDate: new Date(de.scheduled_start_time),
            endDate: de.scheduled_end_time ? new Date(de.scheduled_end_time) : null,
            status: eagleVanguardStatus,
          },
        })
        updated++
      } else {
        await prisma.event.create({
          data: {
            communityId: community.id,
            title: de.name,
            description: de.description ?? null,
            type: discordEntityTypeToEagleVanguard(de.entity_type),
            status: eagleVanguardStatus,
            startDate: new Date(de.scheduled_start_time),
            endDate: de.scheduled_end_time ? new Date(de.scheduled_end_time) : null,
            source: "DISCORD",
            discordEventId: de.id,
          },
        })
        created++
      }
    }

    // Annuler les événements Eagle Vanguard dont l'ID Discord n'existe plus (event supprimé sur Discord)
    for (const existing of existingEvents) {
      if (!discordIds.includes(existing.discordEventId!) && !["COMPLETED", "CANCELLED", "ARCHIVED"].includes(existing.status)) {
        await prisma.event.update({
          where: { id: existing.id },
          data: { status: "CANCELLED" },
        })
        cancelled++
      }
    }
  }

  return NextResponse.json({ communities: communities.length, created, updated, cancelled })
}
