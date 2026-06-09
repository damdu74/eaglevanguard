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
  characterName?: string
  gradeLabel?: string
  gradeIcon?: string
  gradeAbbrev?: string
}

function gradeAbbrev(label: string): string {
  if (!label) return ""
  const words = label.trim().split(/[\s\-]+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 4)
}

interface UnitNodeData {
  label: string
  type: string
  size?: string
  callsign?: string
  imageUrl?: string
  modifier?: string
  isRoot?: boolean
  communityRoot?: boolean
  readOnly?: boolean
  hideHandles?: boolean
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
  // Désactivé pour la case racine de l'ORBAT général (non éditable).
  useEffect(() => {
    if (data.communityRoot) return
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
    data.readOnly || data.hideHandles ? "opacity-0" : "opacity-0 group-hover:opacity-100"
  )

  return (
    <div ref={rootRef} className="relative group">
      {/* 4 handles source sur toutes les cases (ConnectionMode.Loose = reçoit aussi) */}
      {!data.isRoot && (
        <>
          <Handle type="source" position={Position.Top}   id="top"   className={handleCls} />
          <Handle type="source" position={Position.Left}  id="left"  className={handleCls} />
          <Handle type="source" position={Position.Right} id="right" className={handleCls} />
        </>
      )}
      {/* Case racine unité : left + right (pas de top) */}
      {data.isRoot && !data.communityRoot && (
        <>
          <Handle type="source" position={Position.Left}  id="left"  className={handleCls} />
          <Handle type="source" position={Position.Right} id="right" className={handleCls} />
        </>
      )}
      {/* Case racine communauté : seulement le bas */}

      {data.rpUnitId && data.communitySlug && (
        <a
          href={`/communities/${data.communitySlug}/rp/${data.rpUnitId}/orbat?from=orbat-general`}
          onClick={(e) => e.stopPropagation()}
          title="Voir l'ORBAT de l'unité"
          className="absolute -top-2.5 left-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 border border-violet-600 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Network className="h-3 w-3" />
        </a>
      )}

      {!data.readOnly && !data.isRoot && !!data.onToggleLock && (
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
          "w-[360px] rounded-lg border-2 bg-background shadow-sm overflow-hidden transition-colors",
          selected ? "border-primary" : data.isRoot ? "border-violet-500" : data.locked ? "border-red-500/60" : "border-border",
          data.isRoot && "bg-violet-50 dark:bg-violet-950/30"
        )}
      >
        {/* Case racine communauté : logo centré + nom uniquement, non éditable */}
        {data.communityRoot ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-4">
            {data.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.imageUrl}
                alt=""
                style={{ width: 72, height: 72, objectFit: "contain", display: "block" }}
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-lg bg-violet-200/50 dark:bg-violet-900/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-violet-400">{data.label?.[0]?.toUpperCase()}</span>
              </div>
            )}
            <p className="text-sm font-bold text-center leading-tight">{data.label}</p>
          </div>
        ) : (
          <>
            {/* En-tête : image? | nom | icone? — centré dans l'espace disponible */}
            {(() => {
              const hasImage = !!data.imageUrl
              const hasIcon  = !!data.type
              const gridCols = hasImage && hasIcon ? "grid-cols-[72px_1fr_60px]"
                             : hasImage            ? "grid-cols-[72px_1fr]"
                             : hasIcon             ? "grid-cols-[1fr_60px]"
                             :                       "grid-cols-[1fr]"
              return (
                <div className={cn("grid items-center gap-1 px-2 py-2 min-h-[72px]", gridCols)}>
                  {hasImage && (
                    <div className="flex items-center justify-center">
                      <div style={{ width: 56, height: 56, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={data.imageUrl} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
                      </div>
                    </div>
                  )}

                  <div className="text-center min-w-0 px-1">
                    <p className="text-xs font-bold leading-tight truncate">{data.label}</p>
                    {data.callsign && (
                      <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{data.callsign}</p>
                    )}
                  </div>

                  {hasIcon && (
                    <div className="flex items-center justify-center">
                      <NatoSymbol type={data.type} size={data.size} label={data.label} isRoot={data.isRoot} selected={selected} modifier={data.modifier} compact />
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Tableau des postes */}
            {roles.length > 0 && (
              <div className="border-t divide-y divide-border/60">
                {roles.map((role) => {
                  const assigned = role.characterName || role.memberName
                  return (
                    <div key={role.id} className="flex items-center px-2 py-1 gap-1.5">
                      {assigned ? (
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          {(role.gradeAbbrev || role.gradeLabel) && (
                            <span className="text-[9px] font-bold text-primary shrink-0">
                              {role.gradeAbbrev || gradeAbbrev(role.gradeLabel ?? "")}
                            </span>
                          )}
                          <div className="flex items-center gap-0.5 flex-1 min-w-0">
                            <span className="text-[10px] font-medium truncate text-foreground">
                              {role.characterName || role.memberName}
                            </span>
                            {role.gradeIcon && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={role.gradeIcon} alt="" className="h-3.5 w-3.5 shrink-0 object-contain" />
                            )}
                          </div>
                          <span className="text-[9px] text-muted-foreground shrink-0 truncate max-w-[80px]">{role.title}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <span className="text-[9px] text-muted-foreground shrink-0 truncate max-w-[90px]">{role.title}</span>
                          <span className="text-[9px] text-muted-foreground/40 italic">— Vacant</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>


      <Handle type="source" position={Position.Bottom} id="bottom" className={handleCls} />
    </div>
  )
})
