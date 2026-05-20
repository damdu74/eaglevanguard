"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { cn } from "@/lib/utils"

const UNIT_ICONS: Record<string, string> = {
  infantry: "⚔️",
  armor: "🛡️",
  aviation: "✈️",
  artillery: "💥",
  logistics: "🔧",
  hq: "⭐",
  recon: "👁️",
  medical: "➕",
}

interface UnitNodeData {
  label: string
  type: string
  callsign?: string
  memberCount?: number
}

export const OrbatUnitNode = memo(function OrbatUnitNode({ data, selected }: NodeProps<UnitNodeData>) {
  return (
    <div
      className={cn(
        "min-w-[120px] rounded-lg border-2 bg-background px-3 py-2 text-center shadow-sm transition-colors",
        selected ? "border-primary" : "border-border"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />

      <div className="text-lg leading-none mb-1">
        {UNIT_ICONS[data.type] ?? "🔷"}
      </div>
      <p className="text-xs font-semibold leading-tight">{data.label}</p>
      {data.callsign && (
        <p className="text-[10px] text-muted-foreground mt-0.5">{data.callsign}</p>
      )}
      {data.memberCount !== undefined && (
        <p className="text-[10px] text-muted-foreground">{data.memberCount} membres</p>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  )
})
