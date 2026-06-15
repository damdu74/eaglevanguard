"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { RpRoster } from "@/components/community/rp-roster"

interface RpUnit {
  id: string
  name: string
  description: string | null
  era: string | null
  game: string | null
  columnConfig: unknown
  imageUrl: string | null
  _count: { characters: number }
}

interface CommunityEntry {
  community: { id: string; name: string; slug: string; logoUrl: string | null; game: string }
  isStaff: boolean
  units: RpUnit[]
}

interface Props {
  entries: CommunityEntry[]
}

export function RegistreDesUnites({ entries }: Props) {
  const [activeId, setActiveId] = useState(entries[0]?.community.id ?? "")

  if (entries.length === 0) return null

  const active = entries.find(e => e.community.id === activeId) ?? entries[0]

  return (
    <div>
      <div className="flex gap-1 border-b pb-3 mb-4">
        {entries.map(({ community }) => (
          <button
            key={community.id}
            onClick={() => setActiveId(community.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeId === community.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {community.name}
          </button>
        ))}
      </div>
      <RpRoster
        communitySlug={active.community.slug}
        units={active.units}
        isStaff={active.isStaff}
      />
    </div>
  )
}
