import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CandidatureForm } from "@/components/candidature/candidature-form"
import { Clock, CheckCircle2, XCircle, History } from "lucide-react"

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

  const userId = session.user.id as string
  const steamName = session.user.name ?? null

  const community = await prisma.community.findFirst({ orderBy: { createdAt: "asc" } })

  const applications = community
    ? await prisma.application.findMany({
        where: { communityId: community.id, userId },
        orderBy: { createdAt: "desc" },
      })
    : []

  const current = applications.find((a) => a.status === "PENDING") ?? applications[0] ?? null
  const history = applications.filter((a) => a.id !== current?.id)

  const canApply = !applications.some((a) => a.status === "PENDING")

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Mes candidatures</h1>
        <p className="text-sm text-muted-foreground">
          {community?.name ?? "Communauté"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Candidature en cours */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-orange-400" />
              Candidature en cours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {!current ? (
              <div className="px-4 py-2.5 border-t">
                <p className="text-sm text-muted-foreground">Aucune candidature soumise.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-2.5 border-t">
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge variant={STATUS_VARIANTS[current.status]}>
                    {STATUS_LABELS[current.status] ?? current.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 border-t">
                  <p className="text-sm text-muted-foreground">Envoyée le</p>
                  <p className="text-sm">{new Date(current.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                {(current as { age?: number | null }).age != null && (
                  <div className="flex items-center justify-between px-4 py-2.5 border-t">
                    <p className="text-sm text-muted-foreground">Âge</p>
                    <p className="text-sm">{(current as { age?: number | null }).age} ans</p>
                  </div>
                )}
                {(current as { genre?: string | null }).genre && (
                  <div className="flex items-center justify-between px-4 py-2.5 border-t">
                    <p className="text-sm text-muted-foreground">Genre</p>
                    <p className="text-sm">{(current as { genre?: string | null }).genre}</p>
                  </div>
                )}
                {current.message && (
                  <div className="px-4 py-2.5 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Votre message</p>
                    <p className="text-sm">{current.message}</p>
                  </div>
                )}
                {current.status === "PENDING" && (
                  <div className="px-4 py-2.5 border-t">
                    <p className="text-xs text-muted-foreground">
                      Votre candidature est en cours d&apos;examen. Vous serez notifié dès qu&apos;une décision sera prise.
                    </p>
                  </div>
                )}
                {current.status === "ACCEPTED" && (
                  <div className="flex items-center gap-2 px-4 py-2.5 border-t">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <p className="text-sm">Bienvenue dans la communauté !</p>
                  </div>
                )}
                {current.status === "REJECTED" && (
                  <div className="flex items-center gap-2 px-4 py-2.5 border-t">
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {current.response ?? "Candidature refusée."}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Formulaire nouvelle candidature */}
        {canApply && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Postuler</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <CandidatureForm steamName={steamName} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Historique */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <History className="h-4 w-4 text-muted-foreground" />
              Historique des candidatures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {history.map((app) => (
              <div key={app.id} className="flex items-center justify-between px-4 py-2.5 border-t">
                <p className="text-sm text-muted-foreground">
                  {new Date(app.createdAt).toLocaleDateString("fr-FR")}
                </p>
                <Badge variant={STATUS_VARIANTS[app.status]}>
                  {STATUS_LABELS[app.status] ?? app.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
