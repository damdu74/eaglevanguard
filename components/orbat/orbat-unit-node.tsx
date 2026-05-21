"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"

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
  isRoot?: boolean
  readOnly?: boolean
  onAddChild?: (id: string) => void
}

export const OrbatUnitNode = memo(function OrbatUnitNode({ id, data, selected }: NodeProps<UnitNodeData>) {
  return (
    <div className="relative group">
      {/* Handle entrée (caché pour le nœud racine) */}
      {!data.isRoot && (
        <Handle type="target" position={Position.Top} className="!bg-primary" />
      )}

      <div
        className={cn(
          "min-w-[140px] rounded-lg border-2 bg-background px-4 py-3 text-center shadow-sm transition-colors",
          selected ? "border-primary" : "border-border",
          data.isRoot && "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
        )}
      >
        <div className="text-xl leading-none mb-1.5">
          {UNIT_ICONS[data.type] ?? "🔷"}
        </div>
        <p className="text-xs font-semibold leading-tight">{data.label}</p>
        {data.callsign && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{data.callsign}</p>
        )}
        {data.isRoot && (
          <p className="text-[9px] text-violet-500 font-semibold mt-1 uppercase tracking-wide">Commandement</p>
        )}
      </div>

      {/* Bouton ajouter enfant */}
      {!data.readOnly && data.onAddChild && (
        <button
          onClick={(e) => { e.stopPropagation(); data.onAddChild!(id) }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
          title="Ajouter un subordonné"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Handle sortie */}
      <Handle type="source" position={Position.Bottom} className="!bg-primary opacity-0" />
    </div>
  )
})
