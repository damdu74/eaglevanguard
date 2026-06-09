"use client"

import { memo, useEffect, useRef } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { cn } from "@/lib/utils"
import { Gamepad2 } from "lucide-react"

interface GameNodeData {
  label: string
  readOnly?: boolean
  hideHandles?: boolean
  onEdit?: (id: string) => void
}

export const OrbatGameNode = memo(function OrbatGameNode({ id, data, selected }: NodeProps<GameNodeData>) {
  const rootRef = useRef<HTMLDivElement>(null)

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
    data.readOnly || data.hideHandles ? "opacity-0" : "opacity-0 group-hover:opacity-100"
  )

  return (
    <div ref={rootRef} className="relative group">
      <Handle type="source" position={Position.Top}   id="top"   className={handleCls} />
      <Handle type="source" position={Position.Left}  id="left"  className={handleCls} />
      <Handle type="source" position={Position.Right} id="right" className={handleCls} />

      <div className={cn(
        "w-[360px] rounded-lg border-2 bg-background shadow-sm px-4 py-3 transition-colors",
        selected ? "border-primary" : "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
      )}>
        <div className="flex items-center justify-center gap-2">
          <Gamepad2 className="h-4 w-4 text-violet-500 shrink-0" />
          <p className="font-bold text-sm text-center text-violet-700 dark:text-violet-300 leading-tight">
            {data.label}
          </p>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className={handleCls} />
    </div>
  )
})
