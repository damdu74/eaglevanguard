"use client"

import { memo, useEffect, useRef } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Lock, LockOpen, Network } from "lucide-react"
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
  modifier?: string
  isRoot?: boolean
  readOnly?: boolean
  locked?: boolean
  communitySlug?: string
  rpUnitId?: string
  roles?: OrbatRole[]
  onToggleLock?: (id: string) => void
  onEdit?: (id: string) => void
}

export const OrbatUnitNode = memo(function OrbatUnitNode({ id, data, selected }: NodeProps<UnitNodeData>) {
  const roles = data.roles ?? []
  const rootRef = useRef<HTMLDivElement>(null)

  // Listener natif — React synthetic events ne remontent pas fiablement
  // sur les nœuds non-draggables dans ReactFlow v11.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const handler = (e: Event) => {
      e.stopPropagation()
      data.onEdit?.(id)
    }
    el.addEventListener("dblclick", handler)
    return () => el.removeEventListener("dblclick", handler)
  })

  const handleCls = cn(
    "!bg-primary !w-3 !h-3 !border-2 !border-background transition-opacity",
    data.readOnly ? "opacity-0" : "opacity-0 group-hover:opacity-100"
  )

  return (
    <div ref={rootRef} className="relative group">
      {/* Handles haut/gauche/droite — absents sur la case racine */}
      {!data.isRoot && (
        <>
          <Handle type="target" position={Position.Top}   id="top"          className={handleCls} />
          <Handle type="source" position={Position.Left}  id="left-source"  className={handleCls} />
          <Handle type="target" position={Position.Left}  id="left-target"  className={handleCls} />
          <Handle type="source" position={Position.Right} id="right-source" className={handleCls} />
          <Handle type="target" position={Position.Right} id="right-target" className={handleCls} />
        </>
      )}

      {data.rpUnitId && data.communitySlug && (
        <a
          href={`/communities/${data.communitySlug}/rp/${data.rpUnitId}/orbat`}
          onClick={(e) => e.stopPropagation()}
          title="Voir l'ORBAT de l'unité"
          className="absolute -top-2.5 left-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 border border-violet-600 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Network className="h-3 w-3" />
        </a>
      )}

      {!data.readOnly && !data.isRoot && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); data.onToggleLock?.(id) }}
          className={cn(
            "absolute -top-2.5 -right-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-md border transition-opacity",
            data.locked
              ? "bg-red-500 border-red-600 text-white opacity-100"
              : "bg-green-500 border-green-600 text-white opacity-0 group-hover:opacity-100"
          )}
          title={data.locked ? "Déverrouiller" : "Verrouiller"}
        >
          {data.locked
            ? <Lock className="h-3 w-3" />
            : <LockOpen className="h-3 w-3" />
          }
        </button>
      )}

      <div
        className={cn(
          "w-[300px] rounded-lg border-2 bg-background shadow-sm overflow-hidden transition-colors",
          selected ? "border-primary" : data.isRoot ? "border-violet-500" : data.locked ? "border-red-500/60" : "border-border",
          data.isRoot && "bg-violet-50 dark:bg-violet-950/30"
        )}
      >
        {/* En-tête : image (si présente) | nom | symbole OTAN */}
        <div className={cn("grid items-center gap-1 px-2 py-2", data.imageUrl ? "grid-cols-[72px_1fr_60px]" : "grid-cols-[1fr_60px]")}>
          {/* Image (gauche) — masquée si absente */}
          {data.imageUrl && (
            <div className="flex items-center justify-center">
              <div style={{ width: 56, height: 56, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.imageUrl}
                  alt=""
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
                />
              </div>
            </div>
          )}

          {/* Nom (centre) */}
          <div className="text-center min-w-0 px-1">
            <p className="text-xs font-bold leading-tight truncate">{data.label}</p>
            {data.callsign && (
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{data.callsign}</p>
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
              modifier={data.modifier}
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


      <Handle type="source" position={Position.Bottom} id="bottom" className={handleCls} />
    </div>
  )
})
