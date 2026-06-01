"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import Link from "next/link"
import { Users, Building2, FileText, Shield, ChevronRight } from "lucide-react"
import { NexusModerateSearch } from "@/components/nexus/nexus-moderate-search"

interface Stats {
  totalUsers: number
  totalCommunities: number
  pendingApplications: number
  teamSize: number
}

interface Props {
  stats: Stats
}

export function NexusTeamManager({ stats }: Props) {

  const statItems = [
    { label: "Membres NEXUS", value: stats.teamSize, icon: Shield, color: "text-indigo-400" },
    { label: "Utilisateurs", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Communautés", value: stats.totalCommunities, icon: Building2, color: "text-emerald-400" },
    { label: "Candidatures en attente", value: stats.pendingApplications, icon: FileText, color: "text-orange-400" },
  ]

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statItems.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 py-4 px-4">
              <Icon className={`h-5 w-5 shrink-0 ${color}`} />
              <div>
                <p className="text-xl font-bold leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
              </div>
            </CardContent>
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
          <NexusModerateSearch />
        </CardContent>
      </Card>

      {/* Gestion avancée */}
      <Card>
        <CardHeader>
          <CardTitle>Gestion avancée</CardTitle>
          <CardDescription>Grades et configuration du staff.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 p-0">
          <Link
            href="/nexus/team/members"
            className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-medium">Membres</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href="/nexus/team/ranks"
            className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-medium">Rôles et Fonctions</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

    </div>
  )
}
