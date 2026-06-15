"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, ShieldAlert, Gamepad2 } from "lucide-react"

const links = [
  { href: "/eagle-vanguard/team", label: "Équipe", icon: Users },
  { href: "/eagle-vanguard/moderation", label: "Modération", icon: ShieldAlert },
  { href: "/eagle-vanguard/team/players", label: "Joueurs", icon: Gamepad2 },
]

export function EagleVanguardNav() {
  const pathname = usePathname()

  const activeHref = links
    .filter(l => pathname === l.href || pathname.startsWith(l.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  return (
    <div className="flex gap-1 border-b pb-3 mb-2">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeHref === href
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
