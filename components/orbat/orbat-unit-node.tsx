"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Plus } from "lucide-react"
import { NatoSymbol } from "./nato-symbol"
import { cn } from "@/lib/utils"

export interface OrbatRole {
  id: string
  title: string
  memberId?: string
  memberName?: string
}

interface UnitNodeData {
  label: string
  type: string
  size?: string
  callsign?: string
  isRoot?: boolean
  readOnly?: boolean
  roles?: OrbatRole[]
  onAddChild?: (id: string) => void
}

export const OrbatUnitNode = memo(function OrbatUnitNode({ id, data, selected }: NodeProps<UnitNodeData>) {
  const roles = data.roles ?? []

  return (
    <div className="relative group">
      {!data.isRoot && (
        <Handle type="target" position={Position.Top} className="!bg-primary" />
      )}

      <div
        className={cn(
          "w-[260px] rounded-lg border-2 bg-background shadow-sm overflow-hidden transition-colors",
          selected ? "border-primary" : data.isRoot ? "border-violet-500" : "border-border",
          data.isRoot && "bg-violet-50 dark:bg-violet-950/30"
        )}
      >
        {/* En-tête : symbole OTAN + infos unité */}
        <div className="flex items-center gap-2 px-3 py-2">
          <NatoSymbol
            type={data.type}
            size={data.size}
            label={data.label}
            isRoot={data.isRoot}
            selected={selected}
            compact
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold leading-tight truncate">{data.label}</p>
            {data.callsign && (
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{data.callsign}</p>
            )}
            {data.isRoot && (
              <p className="text-[9px] text-violet-500 font-semibold uppercase tracking-wide mt-0.5">Commandement</p>
            )}
          </div>
        </div>

        {/* Tableau des postes */}
        {roles.length > 0 && (
          <div className="border-t divide-y divide-border/60">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center px-3 py-1 gap-2">
                <span className="text-[10px] text-muted-foreground flex-1 truncate">{role.title}</span>
                {role.memberName ? (
                  <span className="text-[10px] font-medium truncate max-w-[100px] text-foreground">{role.memberName}</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground/50 italic">Vacant</span>
                )}
              </div>
            ))}
          </div>
        )}
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
