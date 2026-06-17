import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EagleVanguardNav } from "@/components/eagle-vanguard/eagle-vanguard-nav"
import { Users, FileText, Shield, UserPlus, Clock } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const metadata = { title: "Tableau de bord — Eagle Vanguard Team" }

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
}
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  ACCEPTED: "default",
  REJECTED: "destructive",
}

export default async function EagleVanguardDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isEagleVanguardTeam) redirect("/dashboard")

  const [totalUsers, pendingApplications, teamSize, recentApplications, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { isEagleVanguardTeam: true } }),
    prisma.application.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { steamName: true, discordName: true, name: true } },
        community: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: { isEagleVanguardTeam: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, steamName: true, discordName: true, name: true, createdAt: true },
    }),
  ])

  const statItems = [
    { label: "Eagle Vanguard Team", value: teamSize, icon: Shield, color: "text-indigo-400", href: "/eagle-vanguard/team/members?from=dashboard" },
    { label: "Membres", value: totalUsers, icon: Users, color: "text-blue-400", href: "/eagle-vanguard/team/players" },
    { label: "Candidatures en attente", value: pendingApplications, icon: FileText, color: "text-orange-400", href: "/eagle-vanguard/candidatures" },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Eagle Vanguard Team</h1>
        <p className="text-sm text-muted-foreground">Gestion du staff de la plateforme</p>
      </div>
      <EagleVanguardNav />

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Candidatures en attente */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-orange-400" />
              Candidatures en attente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {recentApplications.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">Aucune candidature en attente.</p>
            ) : (
              <>
                {recentApplications.map((app) => {
                  const name = app.user.steamName ?? app.user.discordName ?? app.user.name ?? "Joueur"
                  return (
                    <div key={app.id} className="flex items-center justify-between px-4 py-2.5 border-t first:border-t-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{name}</p>
                        <p className="text-xs text-muted-foreground">{app.community.name}</p>
                      </div>
                      <Badge variant={STATUS_VARIANTS[app.status]}>{STATUS_LABELS[app.status]}</Badge>
                    </div>
                  )
                })}
                {pendingApplications > 5 && (
                  <Link href="/eagle-vanguard/moderation" className="flex items-center justify-center py-2 border-t text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Voir toutes ({pendingApplications})
                  </Link>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Derniers inscrits */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <UserPlus className="h-4 w-4 text-blue-400" />
              Derniers inscrits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {recentUsers.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">Aucun utilisateur.</p>
            ) : (
              recentUsers.map((user) => {
                const name = user.steamName ?? user.discordName ?? user.name ?? "Joueur"
                return (
                  <div key={user.id} className="flex items-center justify-between px-4 py-2.5 border-t first:border-t-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
