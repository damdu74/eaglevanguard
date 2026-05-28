"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Shield, UserSearch, UserCheck, BookOpen } from "lucide-react"

const navSections = [
  {
    label: "Navigation",
    items: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Communautés",
    items: [
      { href: "/communities/mine", label: "Communautés", icon: Shield, exact: true },
      { href: "/communities", label: "Annuaire", icon: BookOpen, exact: true },
      { href: "/members", label: "Mes membres", icon: Users, exact: true },
    ],
  },
  {
    label: "Joueurs",
    items: [
      { href: "/players", label: "Annuaire joueurs", icon: UserSearch, exact: true },
      { href: "/players/friends", label: "Mes amis", icon: UserCheck, exact: true },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-56 shrink-0 border-r bg-muted/30 md:flex flex-col p-3 gap-4">
      {navSections.map((section) => (
        <div key={section.label} className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            {section.label}
          </p>
          {section.items.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
                  ? "bg-muted font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      ))}


    </aside>
  )
}
