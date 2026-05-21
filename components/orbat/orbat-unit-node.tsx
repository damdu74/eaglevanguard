"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Plus } from "lucide-react"
import { NatoSymbol } from "./nato-symbol"

interface UnitNodeData {
  label: string
  type: string
  size?: string
  callsign?: string
  isRoot?: boolean
  readOnly?: boolean
  onAddChild?: (id: string) => void
}

export const OrbatUnitNode = memo(function OrbatUnitNode({ id, data, selected }: NodeProps<UnitNodeData>) {
  return (
    <div className="relative group">
      {!data.isRoot && (
        <Handle type="target" position={Position.Top} className="!bg-primary" />
      )}

      <div className="px-1 py-1">
        <NatoSymbol
          type={data.type}
          size={data.size}
          label={data.label}
          callsign={data.callsign}
          isRoot={data.isRoot}
          selected={selected}
        />
      </div>

      {!data.readOnly && data.onAddChild && (
        <button
          onClick={(e) => { e.stopPropagation(); data.onAddChild!(id) }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
          title="Ajouter un subordonné"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-primary opacity-0" />
    </div>
  )
})
