"use client"

import { useState } from "react"
import { ImageIcon } from "lucide-react"

interface Props {
  url: string | null
  name: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizes = {
  sm: { container: "w-8 h-8", icon: "h-3.5 w-3.5", rounded: "rounded" },
  md: { container: "w-10 h-10", icon: "h-4 w-4", rounded: "rounded" },
  lg: { container: "w-16 h-16", icon: "h-7 w-7", rounded: "rounded-lg" },
}

export function CommunityLogo({ url, name, size = "md", className }: Props) {
  const [broken, setBroken] = useState(false)
  const { container, icon, rounded } = sizes[size]

  return (
    <div
      className={`${container} ${rounded} border border-border bg-muted/30 flex items-center justify-center shrink-0 overflow-hidden ${className ?? ""}`}
    >
      {url && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          onError={() => setBroken(true)}
        />
      ) : (
        <ImageIcon className={`${icon} text-muted-foreground/40`} />
      )}
    </div>
  )
}
