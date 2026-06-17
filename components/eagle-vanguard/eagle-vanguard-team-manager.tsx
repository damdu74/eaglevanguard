"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import Link from "next/link"
import { Users, FileText, Shield, ChevronRight } from "lucide-react"
import { EagleVanguardModerateSearch } from "@/components/eagle-vanguard/eagle-vanguard-moderate-search"

interface Stats {
  totalUsers: number
  pendingApplications: number
  teamSize: number
}

interface Props {
  stats: Stats
}

export function EagleVanguardTeamManager({ stats }: Props) {

  const statItems = [
    { label: "Eagle Vanguard Team", value: stats.teamSize, icon: Shield, color: "text-indigo-400", href: "/eagle-vanguard/team/members?from=team" },
    { label: "Membres", value: stats.totalUsers, icon: Users, color: "text-blue-400", href: "/eagle-vanguard/team/players?from=team" },
    { label: "Candidatures en attente", value: stats.pendingApplications, icon: FileText, color: "text-orange-400", href: "/eagle-vanguard/candidatures" },
  ]

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {statItems.map(({ label, value, icon: Icon, color, href }) => (
          <Card key={label} className={href ? "hover:bg-muted/50 transition-colors" : ""}>
            {href ? (
              <Link href={href}>
                <CardContent className="flex flex-col items-center py-3 px-4 gap-1.5">
                  <p className="text-xs font-medium text-muted-foreground text-center">{label}</p>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                    <p className="text-xl font-bold leading-none">{value}</p>
                  </div>
                </CardContent>
              </Link>
            ) : (
              <CardContent className="flex flex-col items-center py-3 px-4 gap-1.5">
                <p className="text-xs font-medium text-muted-foreground text-center">{label}</p>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                  <p className="text-xl font-bold leading-none">{value}</p>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Modération rapide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Modération rapide
          </CardTitle>
          <CardDescription>Recherchez un utilisateur pour lui appliquer une sanction.</CardDescription>
        </CardHeader>
        <CardContent>
          <EagleVanguardModerateSearch />
        </CardContent>
      </Card>

    </div>
  )
}
