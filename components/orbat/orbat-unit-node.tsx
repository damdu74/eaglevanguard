"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { ImageIcon, Plus } from "lucide-react"
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
  imageUrl?: string
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
          "w-[300px] rounded-lg border-2 bg-background shadow-sm overflow-hidden transition-colors",
          selected ? "border-primary" : data.isRoot ? "border-violet-500" : "border-border",
          data.isRoot && "bg-violet-50 dark:bg-violet-950/30"
        )}
      >
        {/* En-tête 3 colonnes : image | nom | symbole OTAN */}
        <div className="grid grid-cols-[72px_1fr_60px] items-center gap-1 px-2 py-2">
          {/* Image (gauche) */}
          <div className="flex items-center justify-center">
            {data.imageUrl ? (
              <div style={{ width: 64, height: 64, borderRadius: 6, overflow: "hidden", border: "1px solid hsl(var(--border))", flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.imageUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 6, flexShrink: 0 }} className="border border-dashed border-border/60 bg-muted/30 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
              </div>
            )}
          </div>

          {/* Nom (centre) */}
          <div className="text-center min-w-0 px-1">
            <p className="text-xs font-bold leading-tight truncate">{data.label}</p>
            {data.callsign && (
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{data.callsign}</p>
            )}
            {data.isRoot && (
              <p className="text-[9px] text-violet-500 font-semibold uppercase tracking-wide mt-0.5">Commandement</p>
            )}
          </div>

          {/* Symbole OTAN (droite) */}
          <div className="flex items-center justify-center">
            <NatoSymbol
              type={data.type}
              size={data.size}
              label={data.label}
              isRoot={data.isRoot}
              selected={selected}
              compact
            />
          </div>
        </div>

        {/* Tableau des postes */}
        {roles.length > 0 && (
          <div className="border-t divide-y divide-border/60">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center px-3 py-1 gap-2">
                <span className="text-[10px] text-muted-foreground flex-1 truncate">{role.title}</span>
                {role.memberName ? (
                  <span className="text-[10px] font-medium truncate max-w-[110px] text-foreground">{role.memberName}</span>
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
