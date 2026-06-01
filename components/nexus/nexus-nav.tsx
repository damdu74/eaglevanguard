"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, ShieldAlert, ClipboardList } from "lucide-react"

const links = [
  { href: "/nexus/team", label: "Équipe", icon: Users },
  { href: "/nexus/moderation", label: "Modération", icon: ShieldAlert },
  { href: "/nexus/logs", label: "Logs", icon: ClipboardList },
]

export function NexusNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 border-b pb-3 mb-2">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            pathname.startsWith(href)
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </div>
  )
}
