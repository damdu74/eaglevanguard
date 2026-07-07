"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { RpRoster } from "@/components/community/rp-roster"
import { OrbatEditor } from "@/components/orbat/orbat-editor"
import { GitBranch, BookOpen } from "lucide-react"

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

interface Community {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  game: string
}

interface CommunityEntry {
  community: Community
  isStaff: boolean
  units: RpUnit[]
}

interface OrbatEntry {
  community: Community
  nodes: { id: string; type?: string; position: { x: number; y: number }; data: Record<string, unknown> }[]
  edges: { id: string; source: string; target: string; [key: string]: unknown }[]
  rpUnits: { id: string; name: string; game?: string | null }[]
  unitRootData: Record<string, Record<string, unknown>>
}

interface Props {
  isEV: boolean
  allCommunities: Community[]
  communitiesWithUnits: CommunityEntry[]
  orbatData: OrbatEntry[]
}

export function DashboardTabs({ isEV, allCommunities, communitiesWithUnits, orbatData }: Props) {
  const showOrganigramme = isEV && allCommunities.length > 0
  const showRegistre = communitiesWithUnits.length > 0

  const tabs = [
    ...(showOrganigramme ? [{ id: "organigramme", label: "Organigramme", icon: GitBranch }] : []),
    ...(showRegistre ? [{ id: "registre", label: "Registre des unités", icon: BookOpen }] : []),
  ]

  const searchParams = useSearchParams()
  const requestedTab = searchParams.get("tab")
  const initialTab = tabs.find(t => t.id === requestedTab)?.id ?? tabs[0]?.id ?? ""
  const [activeTab, setActiveTab] = useState(initialTab)

  if (tabs.length === 0) return null

  return (
    <div>
      <div className="flex gap-1 border-b pb-3 mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "organigramme" && showOrganigramme && (
        <OrganigrammeContent entries={orbatData} />
      )}

      {activeTab === "registre" && showRegistre && (
        <RegistreContent entries={communitiesWithUnits} />
      )}
    </div>
  )
}

function OrganigrammeContent({ entries }: { entries: OrbatEntry[] }) {
  const [activeId, setActiveId] = useState(entries[0]?.community.id ?? "")
  const active = entries.find(e => e.community.id === activeId) ?? entries[0]

  if (!active) return null

  return (
    <div>
      {entries.length > 1 && (
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
      )}
      <OrbatEditor
        communitySlug={active.community.slug}
        rootLabel={active.community.name}
        communityLogoUrl={active.community.logoUrl}
        communityUnits={active.rpUnits}
        unitRootData={active.unitRootData}
        initialNodes={active.nodes}
        initialEdges={active.edges}
        readOnly={false}
        fromParam="dashboard"
      />
    </div>
  )
}

function RegistreContent({ entries }: { entries: CommunityEntry[] }) {
  const [activeId, setActiveId] = useState(entries[0]?.community.id ?? "")
  const active = entries.find(e => e.community.id === activeId) ?? entries[0]

  if (!active) return null

  return (
    <div>
      {entries.length > 1 && (
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
      )}
      <RpRoster
        communitySlug={active.community.slug}
        units={active.units}
        isStaff={active.isStaff}
      />
    </div>
  )
}
