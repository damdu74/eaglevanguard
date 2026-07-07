"use client"

import { memo, useEffect, useRef } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { cn } from "@/lib/utils"
import { Gamepad2, Star, BookOpen } from "lucide-react"

interface GameNodeData {
  label: string
  game?: string
  readOnly?: boolean
  hideHandles?: boolean
  onEdit?: (id: string) => void
}

const GAME_THEME: Record<string, { border: string; bg: string; text: string; Icon: React.ElementType }> = {
  "arma3-principale": {
    border: "border-sky-500",
    bg:     "bg-sky-50 dark:bg-sky-950/30",
    text:   "text-sky-700 dark:text-sky-300",
    Icon:   Star,
  },
  "arma3-secondaire": {
    border: "border-yellow-400",
    bg:     "bg-yellow-50 dark:bg-yellow-950/30",
    text:   "text-yellow-700 dark:text-yellow-300",
    Icon:   BookOpen,
  },
}

const DEFAULT_THEME = {
  border: "border-violet-500",
  bg:     "bg-violet-50 dark:bg-violet-950/30",
  text:   "text-violet-700 dark:text-violet-300",
  Icon:   Gamepad2,
}

export const OrbatGameNode = memo(function OrbatGameNode({ id, data, selected }: NodeProps<GameNodeData>) {
  const theme = (data.game && GAME_THEME[data.game]) ? GAME_THEME[data.game] : DEFAULT_THEME
  const { Icon } = theme
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
        selected ? "border-primary" : `${theme.border} ${theme.bg}`
      )}>
        <div className="flex items-center justify-center gap-2">
          <Icon className={cn("h-4 w-4 shrink-0", theme.text)} />
          <p className={cn("font-bold text-sm text-center leading-tight", theme.text)}>
            {data.label}
          </p>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className={handleCls} />
    </div>
  )
})
