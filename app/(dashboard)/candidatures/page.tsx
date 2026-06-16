import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CandidatureForm } from "@/components/candidature/candidature-form"
import { Clock, CheckCircle2, XCircle } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Candidature" }

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

  const community = await prisma.community.findFirst({ orderBy: { createdAt: "asc" } })

  const application = community
    ? await prisma.application.findUnique({
        where: { communityId_userId: { communityId: community.id, userId } },
      })
    : null

  const canApply = !application || application.status === "REJECTED" || application.status === "WITHDRAWN"

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Candidature</h1>
        <p className="text-sm text-muted-foreground">
          Rejoignez {community?.name ?? "la communauté"} en soumettant votre candidature.
        </p>
      </div>

      {!community ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground text-center">
          <p className="text-sm">Aucune communauté disponible pour le moment.</p>
        </div>
      ) : application?.status === "PENDING" ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Candidature en attente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Statut</span>
              <Badge variant={STATUS_VARIANTS[application.status]}>{STATUS_LABELS[application.status]}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Envoyée le</span>
              <span className="text-sm">{new Date(application.createdAt).toLocaleDateString("fr-FR")}</span>
            </div>
            {application.message && (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <p className="text-xs text-muted-foreground mb-1">Votre message</p>
                <p>{application.message}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground pt-1">
              Votre candidature est en cours d&apos;examen. Vous serez notifié dès qu&apos;une décision sera prise.
            </p>
          </CardContent>
        </Card>
      ) : application?.status === "ACCEPTED" ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
            <p className="text-sm">Votre candidature a été acceptée. Bienvenue dans la communauté !</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {application?.status === "REJECTED" && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="flex items-center gap-3 py-4">
                <XCircle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-medium">Candidature refusée</p>
                  {application.response && (
                    <p className="text-xs text-muted-foreground mt-0.5">{application.response}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Vous pouvez soumettre une nouvelle candidature.</p>
                </div>
              </CardContent>
            </Card>
          )}
          {canApply && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Postuler</CardTitle>
              </CardHeader>
              <CardContent>
                <CandidatureForm />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
