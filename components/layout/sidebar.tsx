"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Shield, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/communities", label: "Communautés", icon: Shield },
  { href: "/members", label: "Membres", icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-56 shrink-0 border-r bg-muted/30 md:flex flex-col p-3 gap-1">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
            pathname === href || pathname.startsWith(href + "/")
              ? "bg-muted font-medium"
              : "text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}

      <div className="mt-auto">
        <Button size="sm" className="w-full gap-2" asChild>
          <Link href="/communities/new">
            <Plus className="h-4 w-4" />
            Nouvelle communauté
          </Link>
        </Button>
      </div>
    </aside>
  )
}
