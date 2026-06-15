import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CommunityLogo } from "@/components/community/community-logo"
import { ClipboardList } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Mes candidatures" }

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "En attente",
  ACCEPTED:  "Acceptée",
  REJECTED:  "Refusée",
  WITHDRAWN: "Retirée",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING:   "secondary",
  ACCEPTED:  "default",
  REJECTED:  "destructive",
  WITHDRAWN: "outline",
}

export default async function CandidaturesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const applications = await prisma.application.findMany({
    where: { userId: session.user.id as string },
    include: {
      community: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          game: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Mes candidatures</h1>
        <p className="text-sm text-muted-foreground">Suivi de vos demandes d&apos;adhésion.</p>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground text-center">
          <ClipboardList className="h-10 w-10" />
          <p className="font-medium">Aucune candidature pour le moment.</p>
          <p className="text-sm">Rejoignez une communauté pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4 px-4">
                <div className="flex items-center gap-3 min-w-0">
                  <CommunityLogo url={app.community.logoUrl} name={app.community.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{app.community.name}</p>
                    <p className="text-xs text-muted-foreground">{app.community.game}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={STATUS_VARIANTS[app.status]}>
                    {STATUS_LABELS[app.status] ?? app.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {new Date(app.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </CardContent>
              {app.response && (
                <div className="px-4 pb-4 text-sm text-muted-foreground border-t pt-3">
                  <span className="font-medium">Réponse : </span>{app.response}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
